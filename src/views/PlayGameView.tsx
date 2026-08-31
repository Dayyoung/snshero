import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CardData, AiStrategy, AiDifficulty, Language, PlayerPatterns, Item, Skill, UserStats, UserInfo } from '../types';
import { CardItem } from '../components/CardItem';
import { cn, getFormattedCardName, getAssetUrl, getCardSpriteAsset, getCardSpriteCoords, getCardSpriteStyle } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowLeft, Terminal, Activity, Swords, Trophy, Zap, Hash, Bot, User, MessageCircle, ChevronUp, Minimize2, Maximize2, X, Users, Star, Cpu, Check, Sparkles, FastForward, Shield, ShieldAlert, Brain, HelpCircle, Info, ShieldCheck, Flame, Droplets, Mountain, Wind, Fence, Target as TargetIcon, Eye, EyeOff, Search, Heart, Play, RotateCcw, Navigation, AlertCircle, ScanLine, Leaf, Waves, Skull, Hammer, Ghost, Dices, Gift, Lightbulb, Move, Gem, Share2, UserPlus, ShoppingBag, XCircle, Menu, Coins, Pickaxe, Crosshair, Footprints, Castle, Compass, BookOpen, Award, Sliders, Axe, Fish, BarChart3, Clock, Timer, Volume2, VolumeX, Smile } from 'lucide-react';
import { InBattleEmoteModal, BATTLE_EMOTES, EmoteItem } from '../components/InBattleEmoteModal';
import { generateCard, INITIAL_CARDS, generateUniqueDeck, ensureUniqueDeck, getCardStatWithBonus, generateAiName, syncCardWithDatabase, INITIAL_SKILLS, getCardPower, getNormalizedElement } from '../constants';
import { CARD_DATABASE } from '../cardDatabase';
import { ITEM_DATABASE } from '../constants/itemDatabase';
import { t, translateText, staticTranslations } from '../lib/i18n';
import { useGameSettings } from '../contexts/GameSettingsContext';
import { usePerformanceMode } from '../hooks/usePerformanceMode';
import { PageHeader } from '../components/PageHeader';
import { TranslatedText } from '../components/TranslatedText';
import { analytics, logEvent } from '../lib/firebase';
import { createCommunityPost } from '../lib/communityHelper';
import { DefenseGame } from '../components/DefenseGame';
import { ItemIcon } from '../components/ItemIcon';
import { SnakeBattleGame } from '../components/SnakeBattleGame';
import { GomokuGame } from '../components/GomokuGame';
import { MemoryMatchGame } from '../components/MemoryMatchGame';
import { Slide2048Game } from '../components/Slide2048Game';
import { CardJumperGame } from '../components/CardJumperGame';
import { CardTapGame } from '../components/CardTapGame';
import { CardFlipGame } from '../components/CardFlipGame';
import { CardSlidePuzzleGame } from '../components/CardSlidePuzzleGame';
import { CardSorceryGame } from '../components/CardSorceryGame';
import { CardSlotGame } from '../components/CardSlotGame';
import { CardHeistGame } from '../components/CardHeistGame';
import { CardRushGame } from '../components/CardRushGame';
import { ShootingBattleGame } from '../components/ShootingBattleGame';
import { BreakoutGame } from '../components/BreakoutGame';
import { MinesweeperGame } from '../components/MinesweeperGame';
import { PacmanGame } from '../components/PacmanGame';
import { TictactoeGame } from '../components/TictactoeGame';
import { TrexRunnerGame } from '../components/TrexRunnerGame';
import { NativeAd } from '../components/NativeAd';
import SkillTimingButton from '../components/SkillTimingButton';
import { getEquipmentSetBonus, calculateBattleSynergy, FACTION_ADVANTAGE_COLORS, FACTION_ADVANTAGE_ICONS, EQUIPMENT_SET_ICONS, generateCounterDeck, calculateElementalComboBonus } from '../lib/battleSynergy';
import { incrementMissionProgress } from '../lib/dailyMissions';
import { DailyMissions as DailyMissionsComponent } from '../components/DailyMissions';
import { BattleResultPanel, LeveledUpCardInfo } from '../components/BattleResultPanel';
import { useStoryProgress } from '../hooks/useStoryProgress';
import { useCardSkins } from '../hooks/useCardSkins';
import { StoryBattleBanner } from '../components/StoryBattleBanner';
import { StoryBattleResult } from '../components/StoryBattleResult';
import { ShareTemplateCard } from '../components/ShareTemplateCard';
import { StoryStageSelectModal } from '../components/StoryStageSelectModal';
import { CardLongPressPreviewModal } from '../components/CardLongPressPreviewModal';
import { SkillActivationOverlay, SkillEvent } from '../components/SkillActivationOverlay';
import { PingIndicator } from '../components/PingIndicator';
import { LuckyMatchModal } from '../components/LuckyMatchModal';
import { TreasureChestUnlockModal } from '../components/TreasureChestUnlockModal';
import { ExpeditionModal } from '../components/ExpeditionModal';
import { MonsterBeastariumModal } from '../components/MonsterBeastariumModal';
import { TacticianMasteryModal } from '../components/TacticianMasteryModal';
import { TowerOfTrialsModal } from '../components/TowerOfTrialsModal';
import { BattleGambitModal } from '../components/BattleGambitModal';
import { VoxelMiningDefenseGame } from '../components/VoxelMiningDefenseGame';
import { VoxelPixelStrikeArenaGame } from '../components/VoxelPixelStrikeArenaGame';
import { VoxelSkyParkourGame } from '../components/VoxelSkyParkourGame';
import { BattleComboAnnouncer } from '../components/BattleComboAnnouncer';
import { SecretStampBookModal } from '../components/SecretStampBookModal';
import { BattleSummaryModal, LastBattleSummaryData } from '../components/BattleSummaryModal';
import { ElementAdvantageModal } from '../components/ElementAdvantageModal';
import { TreasureDartModal } from '../components/TreasureDartModal';
import { GoldenPirateRouletteModal } from '../components/GoldenPirateRouletteModal';
import { GoldenArcheryModal } from '../components/GoldenArcheryModal';
import { VoxelBattlegroundsGame } from '../components/VoxelBattlegroundsGame';
import { VoxelDungeonCrawlerGame } from '../components/VoxelDungeonCrawlerGame';
import { VoxelSpaceOdysseyGame } from '../components/VoxelSpaceOdysseyGame';
import { VoxelZombieSurvivalGame } from '../components/VoxelZombieSurvivalGame';
import { VoxelMedievalSiegeGame } from '../components/VoxelMedievalSiegeGame';
import { VoxelTitanMechaGame } from '../components/VoxelTitanMechaGame';
import { VoxelDeepSeaOdysseyGame } from '../components/VoxelDeepSeaOdysseyGame';
import { VoxelAceFighterGame } from '../components/VoxelAceFighterGame';
import { VoxelDriftMasterGame } from '../components/VoxelDriftMasterGame';
import { VoxelMonsterIsleGame } from '../components/VoxelMonsterIsleGame';
import { VoxelCyberNinjaGame } from '../components/VoxelCyberNinjaGame';
import { VoxelRaftSurvivalGame } from '../components/VoxelRaftSurvivalGame';
import { VoxelSnowboardExtremeGame } from '../components/VoxelSnowboardExtremeGame';
import { VoxelPinballKnightsGame } from '../components/VoxelPinballKnightsGame';
import { VoxelPirateBattlesGame } from '../components/VoxelPirateBattlesGame';
import { VoxelPixelOvercookedGame } from '../components/VoxelPixelOvercookedGame';
import { VoxelPropHuntGame } from '../components/VoxelPropHuntGame';
import { VoxelQuantumPortalGame } from '../components/VoxelQuantumPortalGame';
import { VoxelRollingHeroGame } from '../components/VoxelRollingHeroGame';
import { VoxelSuperSmashGame } from '../components/VoxelSuperSmashGame';
import { VoxelTowerCraftGame } from '../components/VoxelTowerCraftGame';
import { VoxelBeatBlasterGame } from '../components/VoxelBeatBlasterGame';
import { VoxelCastleBlasterGame } from '../components/VoxelCastleBlasterGame';
import { VoxelFactoryCraftGame } from '../components/VoxelFactoryCraftGame';
import { VoxelSuperStrikersGame } from '../components/VoxelSuperStrikersGame';
import { VoxelGladiatorColosseumGame } from '../components/VoxelGladiatorColosseumGame';
import { VoxelDragonSlayerGame } from '../components/VoxelDragonSlayerGame';
import { VoxelArcherHeroGame } from '../components/VoxelArcherHeroGame';
import { VoxelVampireSurvivalGame } from '../components/VoxelVampireSurvivalGame';
import { VoxelTankBounceGame } from '../components/VoxelTankBounceGame';
import { VoxelNinjaSlashGame } from '../components/VoxelNinjaSlashGame';
import { VoxelGolfMasterGame } from '../components/VoxelGolfMasterGame';
import { VoxelLumberjackTycoonGame } from '../components/VoxelLumberjackTycoonGame';
import { VoxelFishingMasterGame } from '../components/VoxelFishingMasterGame';
import { VoxelFireRescueGame } from '../components/VoxelFireRescueGame';
import { VoxelWindHunterGame } from '../components/VoxelWindHunterGame';
import { VoxelSubwayRunnerGame } from '../components/VoxelSubwayRunnerGame';
import { VoxelCraneMasterGame } from '../components/VoxelCraneMasterGame';
import { VoxelMonsterTruckGame } from '../components/VoxelMonsterTruckGame';
import { VoxelTowerStackGame } from '../components/VoxelTowerStackGame';
import { VoxelSlamDunkGame } from '../components/VoxelSlamDunkGame';
import { VoxelCoasterTycoonGame } from '../components/VoxelCoasterTycoonGame';
import { VoxelSniperHunterGame } from '../components/VoxelSniperHunterGame';
import { VoxelJetskiWaterGame } from '../components/VoxelJetskiWaterGame';
import { VoxelBaseballDerbyGame } from '../components/VoxelBaseballDerbyGame';
import { VoxelMightyBoxingGame } from '../components/VoxelMightyBoxingGame';
import { VoxelMicroKartGame } from '../components/VoxelMicroKartGame';
import { VoxelTreasureDiggerGame } from '../components/VoxelTreasureDiggerGame';
import { VoxelFlightLandingGame } from '../components/VoxelFlightLandingGame';
import { VoxelGachaClawGame } from '../components/VoxelGachaClawGame';
import { VoxelBilliardsTrickGame } from '../components/VoxelBilliardsTrickGame';
import { VoxelDartsBarGame } from '../components/VoxelDartsBarGame';
import { VoxelWingsuitSkydivingGame } from '../components/VoxelWingsuitSkydivingGame';
import { VoxelBadmintonBlitzGame } from '../components/VoxelBadmintonBlitzGame';
import { VoxelMagnetHoleGame } from '../components/VoxelMagnetHoleGame';
import { VoxelMotocrossStuntGame } from '../components/VoxelMotocrossStuntGame';
import { VoxelSkateboardStreetGame } from '../components/VoxelSkateboardStreetGame';
import { VoxelSnowboardSlalomGame } from '../components/VoxelSnowboardSlalomGame';
import { VoxelKarateBreakGame } from '../components/VoxelKarateBreakGame';
import { VoxelPinballClimberGame } from '../components/VoxelPinballClimberGame';
import { VoxelCrazyTaxiGame } from '../components/VoxelCrazyTaxiGame';
import { VoxelLaserStealthGame } from '../components/VoxelLaserStealthGame';
import { VoxelDojoBalanceGame } from '../components/VoxelDojoBalanceGame';
import { VoxelBubblePopGame } from '../components/VoxelBubblePopGame';
import { VoxelWaterSlideGame } from '../components/VoxelWaterSlideGame';
import { VoxelKrakenHunterGame } from '../components/VoxelKrakenHunterGame';
import { VoxelHalfpipeSkaterGame } from '../components/VoxelHalfpipeSkaterGame';
import { VoxelNetherPortalGame } from '../components/VoxelNetherPortalGame';
import { VoxelMegaFlareAssaultGame } from '../components/VoxelMegaFlareAssaultGame';
import { VoxelSpikeRollingGame } from '../components/VoxelSpikeRollingGame';
import { VoxelTerraQuakeGame } from '../components/VoxelTerraQuakeGame';
import { VoxelDreamweaverGame } from '../components/VoxelDreamweaverGame';
import { VoxelLifeFlameGame } from '../components/VoxelLifeFlameGame';
import { VoxelArcaneNexusGame } from '../components/VoxelArcaneNexusGame';
import { VoxelDreadShadowGame } from '../components/VoxelDreadShadowGame';
import { SpinningProfileShowcase } from '../components/SpinningProfileShowcase';
import { GambitConfig, TacticalStance } from '../types';
import { getSecretStamps, unlockSecretStamp } from '../lib/secretStampHelper';
import { recordHeroBattleResult } from '../lib/heroMasteryHelper';
import { getSeasonItem, setSeasonItem } from '../lib/seasonStorage';
import { triggerHaptic } from '../lib/haptic';

interface PlayGameViewProps {
  effectiveUser?: UserInfo;
  calculatedTotalPower?: number;
  opponentTotalPower?: number;
  playerDeck: CardData[];
  onBack: () => void;
  playSfx: (url: string) => void;
  recordMatchResult: (
    result: 'win' | 'loss' | 'draw', 
    rewardOverride?: number, 
    patterns?: Partial<PlayerPatterns>, 
    battleType?: 'robot' | 'user' | 'pvp_attack' | 'matgo',
    opponentInfo?: { id: string; name: string; sns?: number; wins?: number; losses?: number; draws?: number }
  ) => void;
  isAutoBattle?: boolean;
  aiStrategy?: AiStrategy;
  onAiStrategyChange?: (strategy: AiStrategy) => void;
  botAiStrategy?: AiStrategy;
  aiDifficulty?: AiDifficulty;
  onAiDifficultyChange?: (difficulty: AiDifficulty) => void;
  patterns?: PlayerPatterns;
  initialChallengeTarget?: string | null;
  onChallengeHandled?: () => void;
  pvpOpponent?: { id: string; name: string; deck: CardData[]; totalPower?: number; sns?: number; wins?: number; losses?: number; draws?: number } | null;
  onClearPvpOpponent?: () => void;
  isPvpBoardAttack?: boolean;
  customCardImage?: string | null;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  onToggleAutoBattle?: () => void;
  setIsAutoBattle?: (val: boolean) => void;
  skills?: Skill[];
  onGameStateChange?: (state: string) => void;
  onClawReward?: (card: CardData) => void;
  onClawPlay?: () => void;
  setGlobalPopupOpen?: (open: boolean) => void;
  userStats?: UserStats;
  sns?: number;
  tutorialStep?: number;
  setTutorialStep?: (step: number) => void;
  onTutorialComplete?: () => void;
  showRulesBtn?: boolean;
  isGpsActive?: boolean;
  setIsGpsActive?: (val: boolean) => void;
  gpsCoords?: { lat: number; lng: number } | null;
  setGpsCoords?: (coords: { lat: number; lng: number } | null) => void;
  isPlayground?: boolean;
  isGuildAttack?: boolean;
  updateSns?: (amount: number, reason?: string, type?: 'earned' | 'purchased' | string, targetName?: string) => void;
  setView?: (view: string) => void;
  isTutorialMode?: boolean;
  updateStats?: (stats: UserStats) => void;
  addItem?: (rarity?: 'normal' | 'magic' | 'rare', idOverride?: string) => Item | null;
  onEarnXp?: (amount: number) => void;
  showDefenseTestConsole?: boolean;
  setShowDefenseTestConsole?: React.Dispatch<React.SetStateAction<boolean>>;
  randomPlayTrigger?: number;
  preselectedGameId?: string | null;
  showRewardSelection?: boolean;
  onShowRewardSelectionChange?: (show: boolean) => void;
  currentSeason?: string;
  initialMode?: string;
}

interface QteMatchSummary {
  attempted: boolean;
  successCount: number;
  lastMultiplier: number | null;
}

const INITIAL_QTE_MATCH_SUMMARY: QteMatchSummary = {
  attempted: false,
  successCount: 0,
  lastMultiplier: null,
};

type ChallengeStatus = 'pending' | 'accepted' | 'declined';

interface ChallengeData {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  status: ChallengeStatus;
  matchId?: string;
  turn?: string;
}

const MissionCharacterPortrait: React.FC<{ 
  cardId?: number; 
  name?: string; 
  className?: string;
  language?: string;
  hideStats?: boolean;
}> = ({
  cardId = 41,
  name,
  className,
  language = 'ko',
  hideStats = false,
}) => {
  const safeCardId = CARD_DATABASE[cardId] ? cardId : 41;
  const dbCard = CARD_DATABASE[safeCardId];

  const cardData: CardData = useMemo(() => {
    return {
      id: String(safeCardId),
      title: dbCard?.title || name || `Hero #${safeCardId}`,
      title_en: dbCard?.title_en || name || `Hero #${safeCardId}`,
      title_dis: dbCard?.title_dis,
      stats: dbCard?.stats || [3, 3, 3, 3],
      power: dbCard?.power || 10,
      rarity: dbCard?.rarity || 'bronze',
      element: dbCard?.element || 'monster',
      race: dbCard?.race,
      imageIndex: safeCardId,
      imageUrl: dbCard?.imageUrl,
      level: 1,
      skills: [],
      owner: null,
    };
  }, [safeCardId, dbCard, name]);

  return (
    <div className={cn('relative flex h-full w-full items-center justify-center p-1', className)} title={name || dbCard?.title}>
      <CardItem
        card={cardData}
        className="w-24 h-34 sm:w-28 sm:h-38 rounded-lg shadow-lg pointer-events-none transform group-hover:scale-105 transition-transform duration-300"
        language={language}
        hideStats={hideStats}
      />
    </div>
  );
};

type GameState = 'modeSelect' | 'lobby' | 'searching' | 'playing' | 'gameOver' | 'preMatch' | 'tournament' | 'story' | 'boss' | 'dungeon' | 'defense' | 'running' | 'shooting' | 'snake' | 'gomoku' | 'memorymatch' | 'slide2048' | 'cardjumper' | 'cardtap' | 'cardflip' | 'cardslide' | 'cardsorcery' | 'cardslot' | 'cardheist' | 'cardrush' | 'breakout' | 'minesweeper' | 'pacman' | 'tictactoe' | 'trexrunner' | 'voxeldefense' | 'pixelstrike' | 'voxelparkour' | 'voxelbattlegrounds' | 'voxeldungeon' | 'voxelspace' | 'voxelzombie' | 'voxelsiege' | 'voxeltitan' | 'voxelsuperstrikers' | 'voxelgladiatorcolosseum' | 'voxeldragonslayer' | 'voxelarcherhero' | 'voxelvampiresurvival' | 'voxeltankbounce' | 'voxelninjaslash' | 'voxelgolfmaster' | 'voxellumberjacktycoon' | 'voxelfishingmaster' | 'voxelfirerescue' | 'voxelwindhunter' | 'voxelsubwayrunner' | 'voxelcranemaster' | 'voxelmonstertruck' | 'voxeltowerstack' | 'voxelslamdunk' | 'voxelcoastertycoon' | 'voxelsniperhunter' | 'voxeljetskiwater' | 'voxelbaseballderby' | 'voxelboxingmighty' | 'voxelmicrokart' | 'voxeltreasuredigger' | 'voxelflightlanding' | 'voxelgachaclaw' | 'voxelbilliardstrick' | 'voxeldartsbar' | 'voxelwingsuitskydiving' | 'voxelbadmintonblitz' | 'voxelmagnethole' | 'voxelmotocrossstunt' | 'voxelskateboardstreet' | 'voxelsnowboardslalom' | 'voxelkaratebreak' | 'voxelpinballclimber' | 'voxelcrazytaxi' | 'voxellaserstealth' | 'voxeldojobalance' | 'voxelbubblepop' | 'voxelwaterslide' | 'voxelkrakenhunter' | 'voxelhalfpipeskater' | 'voxelnetherportal' | 'voxelmegaflareassault' | 'voxelspikerolling' | 'voxelterraquake' | 'voxeldreamweaver' | 'voxellifeflame' | 'voxelarcanenexus' | 'voxeldreadshadow';

interface TournamentParticipant {
  id: string;
  name: string;
  isPlayer: boolean;
  power: number;
}

interface TournamentMatch {
  p1: TournamentParticipant | null;
  p2: TournamentParticipant | null;
  winner: TournamentParticipant | null;
  score1?: number;
  score2?: number;
}

interface Character {
  id: string;
  type: 'robot' | 'user';
  status?: 'online' | 'offline';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  name: string;
  avatarUrl?: string;
  deck?: CardData[];
  totalPower?: number;
  sns?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  lat?: number;
  lng?: number;
}

interface FieldMonster {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  cardId: number;
}

interface FieldBattleCard {
  id: string;
  card: CardData;
  hp: number;
  maxHp: number;
  side: 'player' | 'opponent';
  originalIndex: number;
}

interface DamagePopup {
  id: string;
  targetCardId: string;
  amount: number;
  direction: string;
}

import { checkFlips, checkFlipsWithDetails, findBestMove, Board, CardInstance } from '../lib/gameEngine';

interface TruncatableDescriptionProps {
  text: string;
  onShowGuide: () => void;
  language: Language;
  playSfx: (url: string) => void;
}

const TruncatableDescription: React.FC<TruncatableDescriptionProps> = ({ text, onShowGuide, language, playSfx }) => {
  return (
    <button
      onClick={() => {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        onShowGuide();
      }}
      className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-xs transition-all shrink-0 cursor-pointer text-[11px] font-black select-none mt-1"
      title={language === 'ko' ? 'ÏÑ§Î™Ö Î≥¥Í∏∞' : 'Show Description'}
    >
      ?
    </button>
  );
};

export const PlayGameView: React.FC<PlayGameViewProps> = ({ 
  playerDeck, 
  onBack, 
  playSfx, 
  recordMatchResult, 
  isAutoBattle: propIsAutoBattle, 
  aiStrategy = 'balanced',
  onAiStrategyChange,
  botAiStrategy = 'balanced',
  aiDifficulty = 'medium',
  onAiDifficultyChange,
  patterns,
  initialChallengeTarget,
  onChallengeHandled,
  customCardImage,
  isChatOpen,
  onToggleChat,
  onToggleAutoBattle,
  setIsAutoBattle,
  onGameStateChange,
  onClawReward,
  onClawPlay,
  calculatedTotalPower = 0, 
  opponentTotalPower,
  skills = [],
  effectiveUser,
  setGlobalPopupOpen,
  userStats,
  tutorialStep = 0,
  setTutorialStep,
  isTutorialMode = false,
  onTutorialComplete,
  pvpOpponent,
  onClearPvpOpponent,
  isPvpBoardAttack,
  sns,
  isGpsActive = false,
  setIsGpsActive,
  gpsCoords = null,
  setGpsCoords,
  isPlayground = false,
  isGuildAttack = false,
  updateSns,
  setView,
  updateStats,
  addItem,
  onEarnXp,
  showDefenseTestConsole = false,
  setShowDefenseTestConsole,
  randomPlayTrigger = 0,
  preselectedGameId = null,
  currentSeason,
  initialMode
}) => {
  const { language, lowSpecMode, targetFps, batterySaver } = useGameSettings();
  const isIOSDevice = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);
  const isLowPerformance = lowSpecMode || batterySaver || targetFps === '30' || isIOSDevice;
  const perf = usePerformanceMode();
  const [gameState, setGameState] = useState<GameState>(() => {
    if (initialMode === 'story') return 'story';
    if (pvpOpponent || initialMode === 'card') return 'searching';
    return 'modeSelect';
  });

  // Texture Pre-caching state for low-spec device optimization
  const [isTextureCaching, setIsTextureCaching] = useState(false);
  const [textureCacheProgress, setTextureCacheProgress] = useState(0);

  useEffect(() => {
    if (initialMode === 'story') {
      setIsStoryActive(true);
      setGameState('story');
    }
  }, [initialMode]);
  const [showConstructionModal, setShowConstructionModal] = useState(false);
  const [selectedConstructionMode, setSelectedConstructionMode] = useState<string>('');
  const [guideMode, setGuideMode] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'default' | 'popular' | 'recent'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'battle' | 'arcade' | 'puzzle' | 'casual'>('all');
  const [showDailyMissions, setShowDailyMissions] = useState(false);
  const [modePlayData, setModePlayData] = useState<Record<string, { count: number; lastPlayed: number }>>({});
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelpPopup) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelpPopup]);

  const [helpSlideIndex, setHelpSlideIndex] = useState(0);

  // ÌôîÎ©¥ Ï†ÑÌôò Ïãú(gameState Î≥ÄÍ≤Ω Ïãú) Ïä§ÌÅ¨Î°§ ÏúÑÏπòÎ•º 0ÏúºÎ°ú Î¶¨ÏÖã
  useEffect(() => {
    window.scrollTo(0, 0);
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach(container => {
      container.scrollTop = 0;
    });
  }, [gameState]);

  // =========================================================================
  // CUSTOM CONFIRM MODAL (replaces window.confirm)
  // =========================================================================
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // =========================================================================
  // CUSTOM ALERT MODAL (replaces window.alert)
  // =========================================================================
  const [customAlertModal, setCustomAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  const triggerAlert = (message: string, title?: string) => {
    setCustomAlertModal({
      isOpen: true,
      title: title || (language === 'ko' ? 'ÏïåÎ¶º' : 'Notice'),
      message
    });
  };

  // =========================================================================
  // BATTLE GAMBIT & TACTICAL STANCE & SECRET STAMPS (Items 393-405)
  // =========================================================================
  const [gambitConfig, setGambitConfig] = useState<GambitConfig>(() => {
    try {
      const raw = localStorage.getItem('hero_gambit_config_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load gambit config:', e);
    }
    return {
      slots: ['COUNTER_ELEMENT', 'SECURE_CORNERS', 'PRESERVE_ACE'],
      activeStance: 'balanced',
      autoDisassembleNR: false,
    };
  });
  const [isGambitModalOpen, setIsGambitModalOpen] = useState<boolean>(false);
  const [isSecretStampModalOpen, setIsSecretStampModalOpen] = useState<boolean>(false);
  const [isTreasureDartOpen, setIsTreasureDartOpen] = useState<boolean>(false);
  const [isPirateRouletteOpen, setIsPirateRouletteOpen] = useState<boolean>(false);
  const [isArcheryOpen, setIsArcheryOpen] = useState<boolean>(false);
  const [isEmoteModalOpen, setIsEmoteModalOpen] = useState<boolean>(false);
  const [isOpponentMuted, setIsOpponentMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_opponent_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [activeEmoteBubble, setActiveEmoteBubble] = useState<{
    text: string;
    emoji: string;
    side: 'player' | 'opponent';
    id: number;
  } | null>(null);

  const handleToggleOpponentMute = useCallback(() => {
    setIsOpponentMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hero_opponent_muted', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const handleSendEmote = useCallback((emote: EmoteItem) => {
    const emoteId = Date.now();
    setActiveEmoteBubble({
      text: language === 'ko' ? emote.labelKo : emote.labelEn,
      emoji: emote.emoji,
      side: 'player',
      id: emoteId,
    });
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    setTimeout(() => {
      setActiveEmoteBubble(prev => (prev?.id === emoteId ? null : prev));
    }, 2800);

    if (!isOpponentMuted && Math.random() < 0.55) {
      setTimeout(() => {
        const randomAiEmote = BATTLE_EMOTES[Math.floor(Math.random() * BATTLE_EMOTES.length)];
        const aiEmoteId = Date.now();
        setActiveEmoteBubble({
          text: language === 'ko' ? randomAiEmote.labelKo : randomAiEmote.labelEn,
          emoji: randomAiEmote.emoji,
          side: 'opponent',
          id: aiEmoteId,
        });
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setTimeout(() => {
          setActiveEmoteBubble(prev => (prev?.id === aiEmoteId ? null : prev));
        }, 2800);
      }, 1200);
    }
  }, [language, isOpponentMuted, playSfx]);
  const [comboAnnounceData, setComboAnnounceData] = useState<{
    comboType: 'NORMAL' | 'DOUBLE' | 'TRIPLE' | 'MEGA' | 'SAME' | 'PLUS' | 'DOMINO' | 'Z_LIGHTNING' | 'L_STORM' | null;
    comboCount: number;
    isCriticalShatter: boolean;
    maxPowerDiff: number;
  } | null>(null);
  const [isClutchSlowMo, setIsClutchSlowMo] = useState<boolean>(false);
  const [battleStartTime, setBattleStartTime] = useState<number>(Date.now());
  const [hasTriggeredDoubleBreak, setHasTriggeredDoubleBreak] = useState<boolean>(false);

  const handleSaveGambitConfig = (newConfig: GambitConfig) => {
    setGambitConfig(newConfig);
    try {
      localStorage.setItem('hero_gambit_config_v1', JSON.stringify(newConfig));
      localStorage.setItem('hero_battle_gambit_config_v1', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save gambit config:', e);
    }
  };

  const handleStanceChange = (stance: TacticalStance) => {
    const newConfig = { ...gambitConfig, activeStance: stance };
    handleSaveGambitConfig(newConfig);
  };

  // Centralized minigame reward: grants SNS coins + card XP
  const handleMinigameReward = (amount: number, rewardKo: string, rewardEn: string) => {
    if (amount > 0) {
      const reason = language === 'ko' ? rewardKo : rewardEn;
      updateSns?.(amount, reason);
      const xpAmount = Math.ceil(amount * 0.5);
      onEarnXp?.(xpAmount);
      // ÏùºÏùº ÎØ∏ÏÖò ÏßÑÌñâÎèÑ ÏóÖÎç∞Ïù¥Ìä∏ (ÎØ∏ÎãàÍ≤åÏûÑ ÌîåÎ†àÏù¥)
      incrementMissionProgress('play_minigame', 1);
    }
  };

  // =========================================================================
  // STORY MODE STATES & HELPER FUNCTIONS
  // =========================================================================
  const [storyAct, setStoryAct] = useState<number>(0);
  const [storyStep, setStoryStep] = useState<number>(0);
  const [isStoryActive, setIsStoryActive] = useState<boolean>(false);
  const [storyReward, setStoryReward] = useState<number>(0);
  const [showStoryResultModal, setShowStoryResultModal] = useState<boolean>(false);
  const [storyBonusItem, setStoryBonusItem] = useState<any | null>(null);
  const [isStoryFinished, setIsStoryFinished] = useState<boolean>(false);
  const [isStoryAutoPlay, setIsStoryAutoPlay] = useState<boolean>(false);

  const {
    storyState,
    storyProgressCount,
    storyProgressPercent,
    weeklyWebtoon,
    totalStoryEpisodes,
    currentWeeklyEpisodeId,
    setStoryStage,
    completeStoryBattle,
    claimStoryBattleReward,
    hasCompletedStoryBattle,
    hasClaimedStoryBattleReward,
  } = useStoryProgress({ season: currentSeason });

  // Skin system
  const season = currentSeason || 'season1';
  const cardSkins = useCardSkins(season);

  const weeklyStoryCharacterNames = useMemo(() => {
    if (!weeklyWebtoon) return [] as string[];
    return weeklyWebtoon.characterIds.flatMap((characterId) => {
      const card = CARD_DATABASE[characterId];
      return card ? [getFormattedCardName(card, language)] : [];
    });
  }, [language, weeklyWebtoon]);


  
  // Sync activeSkinKey onto playerDeck cards
  const playerDeckWithSkins = useMemo(() => 
    playerDeck.map(card => {
      const skinKey = cardSkins.activeSkinMap[card.imageIndex ?? 0];
      if (skinKey && card.activeSkinKey !== skinKey) {
        return { ...card, activeSkinKey: skinKey };
      }
      if (!skinKey && card.activeSkinKey) {
        return { ...card, activeSkinKey: undefined };
      }
      return card;
    }),
    [playerDeck, cardSkins.activeSkinMap],
  );

  const [orderedPlayerDeck, setOrderedPlayerDeck] = useState<CardData[]>(() => {
    return (playerDeckWithSkins && playerDeckWithSkins.length > 0) ? playerDeckWithSkins : INITIAL_CARDS;
  });

  useEffect(() => {
    if (playerDeckWithSkins && playerDeckWithSkins.length > 0) {
      setOrderedPlayerDeck(playerDeckWithSkins);
    }
  }, [playerDeckWithSkins]);

  const handleReorderDeck = useCallback((newDeck: CardData[]) => {
    setOrderedPlayerDeck(newDeck);
    const cardIds = newDeck.map(c => Number(c.imageIndex ?? c.id)).filter(id => !isNaN(id) && id > 0);
    if (typeof window !== 'undefined') {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      setSeasonItem('hero_deck', season, JSON.stringify(cardIds));
      setSeasonItem('hero_deck_guest', season, JSON.stringify(cardIds));
      window.dispatchEvent(new Event('snshero_deck_updated'));
    }
  }, []);

  useEffect(() => {
    setStoryAct(storyState.act);
    setStoryStep(storyState.step);
    setIsStoryActive(storyState.isActive);
    if (storyState.isActive && gameState !== 'story') {
      setGameState('story');
    }
  }, [gameState, storyState.act, storyState.isActive, storyState.step]);

  const saveStoryProgress = (act: number, step: number, isActive = true) => {
    setStoryStage(act, step, isActive);
  };

  const currentStoryBattleContext = useMemo(() => {
    if (isStoryActive) {
      return {
        battleId: `story-act-${storyAct}-step-${storyStep}`,
        rewardId: `story-act-reward-${storyAct}-${storyStep}`,
      };
    }

    if (currentWeeklyEpisodeId) {
      return {
        battleId: `weekly-webtoon:${currentWeeklyEpisodeId}`,
        rewardId: `weekly-webtoon-reward:${currentWeeklyEpisodeId}`,
      };
    }

    if (weeklyWebtoon) {
      const weeklyFallbackKey = `${season}-episode-${weeklyWebtoon.episodeNumber}`;
      return {
        battleId: `weekly-webtoon:${weeklyFallbackKey}`,
        rewardId: `weekly-webtoon-reward:${weeklyFallbackKey}`,
      };
    }

    return null;
  }, [currentWeeklyEpisodeId, isStoryActive, season, storyAct, storyStep, weeklyWebtoon]);

  const currentStoryBattleCompleted = currentStoryBattleContext
    ? hasCompletedStoryBattle(currentStoryBattleContext.battleId)
    : false;
  const currentStoryRewardClaimed = currentStoryBattleContext
    ? hasClaimedStoryBattleReward(currentStoryBattleContext.rewardId)
    : false;

  // Story Stage Select Modal (Item 56, 60, 68) & Skill Activation Overlay (Item 54)
  const [isStoryStageModalOpen, setIsStoryStageModalOpen] = useState(false);
  const [activeSkillEvent, setActiveSkillEvent] = useState<SkillEvent | null>(null);

  // =========================================================================
  // BOSS MODE (10-HOUR COOLDOWN BOSS RAID) STATES & HELPER FUNCTIONS
  // =========================================================================
  const [isBossActive, setIsBossActive] = useState<boolean>(false);
  const [currentBossFightCardId, setCurrentBossFightCardId] = useState<number | null>(null);

  const saveBossState = (isActive: boolean) => {
    localStorage.setItem('hero_boss_active_state', JSON.stringify({ isActive }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('hero_boss_active_state');
    if (saved) {
      try {
        const { isActive } = JSON.parse(saved);
        if (isActive) {
          setIsBossActive(true);
          setGameState('boss');
        }
      } catch (e) {
        console.error("Failed to parse boss active state:", e);
      }
    }
  }, []);

  const bossList = [
    { id: 110, reward: 400 }, // Act 1 Boss: Black Dragon
    { id: 60, reward: 400 },  // Act 2 Boss: Death Knight
    { id: 100, reward: 400 }, // Act 3 Boss: Ultimate Weapon
    { id: 70, reward: 400 }   // Act 4 Boss: Demon Hunter
  ];

  const startBossMatch = (bossCardId: number) => {
    const bossCard = CARD_DATABASE[bossCardId];
    if (!bossCard) return;

    // Boss Battle Difficulty & Power Calculation
    const oppPower = Math.ceil((calculatedTotalPower || 1000) * 1.5);
    
    // Opponent Deck generation with the primary Boss card & guaranteed unique cards
    const bossCardData = {
      ...bossCard,
      id: `boss-raid-${Date.now()}`,
      owner: 'ai' as const,
      bonusPower: 0,
      xp: 0,
      imageIndex: bossCardId,
      isFinalBoss: true
    };
    const baseDeck = ensureUniqueDeck([bossCardData, ...generateUniqueDeck(4)], 5);

    setCurrentBossFightCardId(bossCardId);

    setSelectedOpponent({
      id: `boss-raid-${bossCard.title_en}-${Date.now()}`,
      name: language === 'ko' ? bossCard.title : (bossCard.title_dis || bossCard.title_en),
      totalPower: oppPower,
      wins: 0,
      losses: 0,
      draws: 0,
      sns: 0,
      deck: baseDeck
    });

    if (setIsAutoBattle) {
      setIsAutoBattle(true);
    }

    setGameState('preMatch');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const runBossOutcome = (playerWon: boolean) => {
    if (!isBossActive || !currentBossFightCardId) return;

    if (playerWon) {
      const cooldowns = JSON.parse(localStorage.getItem('hero_boss_cooldowns') || '{}');
      cooldowns[currentBossFightCardId] = Date.now();
      localStorage.setItem('hero_boss_cooldowns', JSON.stringify(cooldowns));

      recordMatchResult('win', 400, undefined, 'robot');
    } else {
      recordMatchResult('loss', 0, undefined, 'robot');
    }

    setCurrentBossFightCardId(null);
  };

  // =========================================================================
  // DEFENSE MODE (TOWER DEFENSE ON S-PATH) HELPERS
  // =========================================================================

  // =========================================================================
  // RUNNING & TREASURE BATTLE MODE STATES & HELPERS
  // =========================================================================
  const [isRunningActive, setIsRunningActive] = useState<boolean>(false);
  const [activeRunningMode, setActiveRunningMode] = useState<'running' | 'treasure'>('running');
  const [runningDistance, setRunningDistance] = useState<number>(0);
  const [runningCalories, setRunningCalories] = useState<number>(0);
  const [runningEarnedSns, setRunningEarnedSns] = useState<number>(0);
  const [runningCoordinates, setRunningCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [runningEarnedCards, setRunningEarnedCards] = useState<CardData[]>([]);
  const [showRunningCardPopup, setShowRunningCardPopup] = useState<boolean>(false);
  const [runningRecentlyEarnedCard, setRunningRecentlyEarnedCard] = useState<CardData | null>(null);
  const [showRunningSyncSummaryModal, setShowRunningSyncSummaryModal] = useState<boolean>(false);
  const [runningMapImage, setRunningMapImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isRunningLocationDenied, setIsRunningLocationDenied] = useState<boolean>(false);
  const [runningStartTime, setRunningStartTime] = useState<number>(0);
  const [showAnticheatPopup, setShowAnticheatPopup] = useState<boolean>(false);

  // Treasure Battle specific states
  interface TreasureChest {
    id: string;
    lat: number;
    lng: number;
    isOpened: boolean;
  }
  const [treasureChests, setTreasureChests] = useState<TreasureChest[]>([]);
  const [showTreasureChestPopup, setShowTreasureChestPopup] = useState<boolean>(false);
  const [treasureRecentlyEarned, setTreasureRecentlyEarned] = useState<{
    card: CardData;
    item: Item | null;
  } | null>(null);
  const treasureMarkersRef = useRef<{ [key: string]: any }>({});

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const mapPolylineRef = useRef<any>(null);
  const mapMarkerRef = useRef<any>(null);
  const hasRecordedRef = useRef<boolean>(false);

  // ÌïòÎ≤ÑÏÇ¨Ïù∏ Í≥µÏãùÏóê Îî∞Î•∏ ÏúÑÏπò Í±∞Î¶¨(m) Í≥ÑÏÇ∞Í∏∞
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // ÏßÄÍµ¨ Î∞òÍ≤Ω (meters)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getRunningAvatarUrl = () => {
    const photoURL = effectiveUser?.photoURL || '';
    if (typeof photoURL === 'string' && photoURL.startsWith('preset:')) {
      const presetId = photoURL.split(':')[1] || '0';
      return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero-${presetId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    }
    return photoURL || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(effectiveUser?.displayName || 'Hero')}&backgroundColor=b6e3f4`;
  };

  const getRunningUserIcon = () => {
    if (!window.L) return null;
    const photoURL = effectiveUser?.photoURL || '';
    if (typeof photoURL === 'string' && photoURL.startsWith('card:')) {
      const cardId = Number(photoURL.split(':')[1]) || 1;
      const idx = CARD_DATABASE[cardId] ? cardId : 1;
      const spriteInfo = getCardSpriteCoords(idx);
      const html = `
        <div style="position:relative;width:44px;height:44px;border-radius:9999px;background:linear-gradient(135deg,#4f46e5,#06b6d4);border:3px solid white;box-shadow:0 8px 18px rgba(0,0,0,.35);overflow:hidden;">
          <div style="width:130%;height:130%;transform:translate(-11%,-11%);background-image:url('${spriteInfo.assetUrl}');background-size:${spriteInfo.cols * 100}% ${spriteInfo.rows * 100}%;background-position:${spriteInfo.xPercent}% ${spriteInfo.yPercent}%;background-repeat:no-repeat;image-rendering:pixelated;"></div>
          <span style="position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);width:14px;height:14px;background:#22c55e;border:2px solid white;border-radius:9999px;"></span>
        </div>
      `;
      return window.L.divIcon({
        html,
        className: 'snshero-running-avatar-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
    }
    const avatarUrl = getRunningAvatarUrl().replace(/"/g, '&quot;');
    const initial = String(effectiveUser?.displayName || effectiveUser?.name || 'U').trim().slice(0, 1).toUpperCase() || 'U';
    const html = `
      <div style="position:relative;width:44px;height:44px;border-radius:9999px;background:linear-gradient(135deg,#4f46e5,#06b6d4);border:3px solid white;box-shadow:0 8px 18px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="${avatarUrl}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;display:block;background:#0f172a;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
        <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;color:white;font-weight:900;font-size:16px;font-family:system-ui,sans-serif;">${initial}</span>
        <span style="position:absolute;left:50%;bottom:-2px;transform:translateX(-50%);width:14px;height:14px;background:#22c55e;border:2px solid white;border-radius:9999px;"></span>
      </div>
    `;
    return window.L.divIcon({
      html,
      className: 'snshero-running-avatar-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  };

  const createRunningUserMarker = (lat: number, lng: number) => {
    if (!window.L || !mapInstanceRef.current) return null;
    const icon = getRunningUserIcon();
    return icon
      ? window.L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current)
      : window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
  };

  const drawSingleCommonCard = () => {
    const rand = Math.random() * 100;
    let selectedRarity: 'bronze' | 'silver' | 'gold' = 'bronze';
    
    // Common Pack (Bronze Pack) odds: Gold 0.1%, Silver 1.0% (Cumulative 1.1%), Bronze 98.9%
    if (rand <= 0.1) {
      selectedRarity = 'gold';
    } else if (rand <= 1.1) {
      selectedRarity = 'silver';
    } else {
      selectedRarity = 'bronze';
    }

    const cardsOfRarity = Object.values(CARD_DATABASE).filter(card => card.rarity === selectedRarity && !card.delete);
    if (cardsOfRarity.length > 0) {
      return cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
    }
    const activeKeys = Object.keys(CARD_DATABASE).map(Number).filter(id => !CARD_DATABASE[id].delete);
    const randId = activeKeys[Math.floor(Math.random() * activeKeys.length)] || 1;
    return CARD_DATABASE[randId] || CARD_DATABASE[1];
  };

  // =========================================================================
  // MATCHMAKING HELPER: Closest TP match unconditionally (no filtering)
  // =========================================================================
  const findBestMatchingRobot = (robots: Character[], playerPower: number, _playerSns: number): Character | null => {
    if (robots.length === 0) return null;

    // Sort all robots by TP difference from player (ascending)
    const sortedByPowerDiff = [...robots].sort((a, b) => {
      const powerDiffA = Math.abs((a.totalPower || 0) - playerPower);
      const powerDiffB = Math.abs((b.totalPower || 0) - playerPower);
      return powerDiffA - powerDiffB;
    });

    // Pick from top 3 closest TP matches for some variety
    const topCount = Math.min(3, sortedByPowerDiff.length);
    return sortedByPowerDiff[Math.floor(Math.random() * topCount)];
  };

  const startRunningBattle = () => {
    setConfirmModal({
      isOpen: true,
      title: language === 'ko' ? 'ÏúÑÏπò Ï†ïÎ≥¥ Í∂åÌïú ÎèôÏùò' : 'LOCATION ACCESSIBILITY REQUIREMENT',
      message: t('running_permission_prompt', language, { rewardInfo: t('running_reward_info', language) }),
      onConfirm: () => {
        if (!navigator.geolocation) {
          triggerAlert(
            language === 'ko' ? 'Ïù¥ Î∏åÎùºÏö∞Ï†ÄÎäî ÏúÑÏπò Ï†ïÎ≥¥Î•º ÏßÄÏõêÌïòÏßÄ ÏïäÏäµÎãàÎã§.' : 'Geolocation is not supported by your browser.',
            language === 'ko' ? 'Ïò§Î•ò' : 'ERROR'
          );
          return;
        }
        
        setActiveRunningMode('running');
        setIsRunningActive(true);
        setGameState('running');
        setRunningDistance(0);
        setRunningCalories(0);
        setRunningEarnedSns(0);
        setRunningCoordinates([]);
        setRunningEarnedCards([]);
        setRunningStartTime(Date.now());
        lastPositionRef.current = null;
        
        localStorage.setItem('hero_running_session_data', JSON.stringify({
          distance: 0,
          earnedSns: 0,
          earnedCards: [],
          coordinates: []
        }));
        
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newCoord = { lat: latitude, lng: longitude };
            
            setRunningCoordinates(prev => {
              const updated = [...prev, newCoord];
              
              if (window.L && mapInstanceRef.current) {
                if (mapMarkerRef.current) {
                  mapMarkerRef.current.setLatLng([latitude, longitude]);
                } else {
                  mapMarkerRef.current = createRunningUserMarker(latitude, longitude);
                }
                
                const latlngs = updated.map(c => [c.lat, c.lng]);
                if (mapPolylineRef.current) {
                  mapPolylineRef.current.setLatLngs(latlngs);
                } else {
                  mapPolylineRef.current = window.L.polyline(latlngs, { color: '#ec4899', weight: 6 }).addTo(mapInstanceRef.current);
                }
                
                mapInstanceRef.current.setView([latitude, longitude], 17);
              }
              
              if (lastPositionRef.current) {
                const distChange = getDistance(
                  lastPositionRef.current.lat, 
                  lastPositionRef.current.lng, 
                  latitude, 
                  longitude
                );
                
                if (distChange >= 1.0) {
                  setRunningDistance(prevDist => {
                    const nextDist = prevDist + distChange;
                    
                     const prev10mInterval = Math.floor(prevDist / 10);
                    const next10mInterval = Math.floor(nextDist / 10);
                    let newEarnedSns = 0;

                    if (next10mInterval > prev10mInterval) {
                      newEarnedSns = (next10mInterval - prev10mInterval) * 1;
                      setRunningEarnedSns(s => s + newEarnedSns);
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    }

                    const prev100mInterval = Math.floor(prevDist / 100);
                    const next100mInterval = Math.floor(nextDist / 100);
                    let newlyEarned: CardData[] = [];

                    if (next100mInterval > prev100mInterval) {
                      const loops = next100mInterval - prev100mInterval;
                      for (let k = 0; k < loops; k++) {
                        const dbCard = drawSingleCommonCard();
                        const newCard: CardData = {
                          ...dbCard,
                          id: String(dbCard.id),
                          owner: 'player',
                          level: dbCard.level || 1,
                        };
                        newlyEarned.push(newCard);
                      }
                      
                      if (newlyEarned.length > 0) {
                        setRunningEarnedCards(cards => [...cards, ...newlyEarned]);
                        setRunningRecentlyEarnedCard(newlyEarned[newlyEarned.length - 1]);
                        setShowRunningCardPopup(true);
                        
                        setTimeout(() => {
                          setShowRunningCardPopup(false);
                        }, 1500);
                      }
                    }
                    
                    setRunningCalories(nextDist * 0.06);
                    
                    const stored = localStorage.getItem('hero_running_session_data');
                    if (stored) {
                      try {
                        const parsed = JSON.parse(stored);
                        parsed.distance = nextDist;
                        parsed.earnedSns = (parsed.earnedSns || 0) + newEarnedSns;
                        parsed.earnedCards = [...(parsed.earnedCards || []), ...newlyEarned];
                        parsed.coordinates = updated;
                        localStorage.setItem('hero_running_session_data', JSON.stringify(parsed));
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    
                    return nextDist;
                  });
                  
                  lastPositionRef.current = newCoord;
                }
              } else {
                lastPositionRef.current = newCoord;
              }
              
              return updated;
            });
          },
          (error) => {
            console.error("GPS Watch error:", error);
            setIsRunningLocationDenied(true);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        
        watchIdRef.current = watchId;
      }
    });
  };

  const generateRandomChests = (centerLat: number, centerLng: number): TreasureChest[] => {
    const chests: TreasureChest[] = [];
    for (let i = 0; i < 5; i++) {
      const distance = 20 + Math.random() * 80; // 20m ~ 100m
      const angle = Math.random() * 2 * Math.PI;
      const latOffset = (distance * Math.cos(angle)) / 111000;
      const lngOffset = (distance * Math.sin(angle)) / (111000 * Math.cos(centerLat * Math.PI / 180));
      
      chests.push({
        id: `treasure_${i}_${Date.now()}`,
        lat: centerLat + latOffset,
        lng: centerLng + lngOffset,
        isOpened: false
      });
    }
    return chests;
  };

  const startTreasureBattle = () => {
    setConfirmModal({
      isOpen: true,
      title: language === 'ko' ? 'ÏúÑÏπò Ï†ïÎ≥¥ Í∂åÌïú ÎèôÏùò' : 'LOCATION ACCESSIBILITY REQUIREMENT',
      message: t('treasure_permission_prompt', language, { rewardInfo: t('treasure_reward_info', language) }),
      onConfirm: () => {
        if (!navigator.geolocation) {
          triggerAlert(
            language === 'ko' ? 'Ïù¥ Î∏åÎùºÏö∞Ï†ÄÎäî ÏúÑÏπò Ï†ïÎ≥¥Î•º ÏßÄÏõêÌïòÏßÄ ÏïäÏäµÎãàÎã§.' : 'Geolocation is not supported by your browser.',
            language === 'ko' ? 'Ïò§Î•ò' : 'ERROR'
          );
          return;
        }
        
        setActiveRunningMode('treasure');
        setIsRunningActive(true);
        setGameState('treasure');
        setRunningDistance(0);
        setRunningCalories(0);
        setRunningEarnedSns(0);
        setRunningCoordinates([]);
        setRunningEarnedCards([]);
        setRunningStartTime(Date.now());
        lastPositionRef.current = null;
        setTreasureChests([]);
        
        localStorage.setItem('hero_running_session_data', JSON.stringify({
          distance: 0,
          earnedSns: 0,
          earnedCards: [],
          coordinates: []
        }));
        
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newCoord = { lat: latitude, lng: longitude };
            
            setTreasureChests(prevChests => {
              if (prevChests.length === 0) {
                const generated = generateRandomChests(latitude, longitude);
                if (window.L && mapInstanceRef.current) {
                  generated.forEach(chest => {
                    const pulseIconHtml = `
                      <div class="relative flex items-center justify-center w-10 h-10">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span class="relative text-2xl">üéÅ</span>
                      </div>
                    `;
                    const icon = window.L.divIcon({
                      html: pulseIconHtml,
                      className: 'custom-chest-icon',
                      iconSize: [40, 40],
                      iconAnchor: [20, 20]
                    });
                    const marker = window.L.marker([chest.lat, chest.lng], { icon }).addTo(mapInstanceRef.current);
                    treasureMarkersRef.current[chest.id] = marker;
                  });
                }
                return generated;
              }
              return prevChests;
            });

            setRunningCoordinates(prev => {
              const updated = [...prev, newCoord];
              
              if (window.L && mapInstanceRef.current) {
                if (mapMarkerRef.current) {
                  mapMarkerRef.current.setLatLng([latitude, longitude]);
                } else {
                  mapMarkerRef.current = createRunningUserMarker(latitude, longitude);
                }
                
                const latlngs = updated.map(c => [c.lat, c.lng]);
                if (mapPolylineRef.current) {
                  mapPolylineRef.current.setLatLngs(latlngs);
                } else {
                  mapPolylineRef.current = window.L.polyline(latlngs, { color: '#ec4899', weight: 6 }).addTo(mapInstanceRef.current);
                }
                
                mapInstanceRef.current.setView([latitude, longitude], 17);
              }
              
              if (lastPositionRef.current) {
                const distChange = getDistance(
                  lastPositionRef.current.lat, 
                  lastPositionRef.current.lng, 
                  latitude, 
                  longitude
                );
                
                if (distChange >= 1.0) {
                  setRunningDistance(prevDist => {
                    const nextDist = prevDist + distChange;
                    
                    const prev10mInterval = Math.floor(prevDist / 10);
                    const next10mInterval = Math.floor(nextDist / 10);
                    let newEarnedSns = 0;

                    if (next10mInterval > prev10mInterval) {
                      newEarnedSns = (next10mInterval - prev10mInterval) * 1;
                      setRunningEarnedSns(s => s + newEarnedSns);
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    }
                    
                    setRunningCalories(nextDist * 0.06);
                    
                    const stored = localStorage.getItem('hero_running_session_data');
                    if (stored) {
                      try {
                        const parsed = JSON.parse(stored);
                        parsed.distance = nextDist;
                        parsed.earnedSns = (parsed.earnedSns || 0) + newEarnedSns;
                        parsed.coordinates = updated;
                        localStorage.setItem('hero_running_session_data', JSON.stringify(parsed));
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    
                    return nextDist;
                  });
                  
                  lastPositionRef.current = newCoord;
                }
              } else {
                lastPositionRef.current = newCoord;
              }
              
              // 10m Ïù¥ÎÇ¥Î°ú Î≥¥Î¨ºÏÉÅÏûêÏóê Ï†ëÍ∑ºÌñàÎäîÏßÄ Í≤ÄÏÇ¨
              setTreasureChests(chests => {
                let changed = false;
                const nextChests = chests.map(chest => {
                  if (!chest.isOpened) {
                    const distToChest = getDistance(latitude, longitude, chest.lat, chest.lng);
                    if (distToChest <= 10.0) {
                      changed = true;
                      
                      // Ïπ¥Îìú ÌöçÎìù
                      const dbCard = drawSingleCommonCard();
                      const newCard: CardData = {
                        ...dbCard,
                        id: String(dbCard.id),
                        owner: 'player',
                        level: dbCard.level || 1,
                      };
                      setRunningEarnedCards(cards => [...cards, newCard]);
                      
                      // ÏïÑÏù¥ÌÖú ÌöçÎìù
                      const newItem = addItem ? addItem() : null;
                      
                      // Ìö®Í≥ºÏùå
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                      
                      // ÏßÄÎèÑ ÎßàÏª§ Ï†úÍ±∞
                      if (treasureMarkersRef.current[chest.id]) {
                        treasureMarkersRef.current[chest.id].remove();
                        delete treasureMarkersRef.current[chest.id];
                      }
                      
                      // ÌåùÏóÖ ÏÑ§Ï†ï Î∞è 3Ï¥à ÎÖ∏Ï∂ú
                      setTreasureRecentlyEarned({
                        card: newCard,
                        item: newItem
                      });
                      setShowTreasureChestPopup(true);
                      setTimeout(() => {
                        setShowTreasureChestPopup(false);
                      }, 3000);
                      
                      const stored = localStorage.getItem('hero_running_session_data');
                      if (stored) {
                        try {
                          const parsed = JSON.parse(stored);
                          parsed.earnedCards = [...(parsed.earnedCards || []), newCard];
                          localStorage.setItem('hero_running_session_data', JSON.stringify(parsed));
                        } catch (e) {
                          console.error(e);
                        }
                      }
                      
                      return { ...chest, isOpened: true };
                    }
                  }
                  return chest;
                });
                return changed ? nextChests : chests;
              });
              
              return updated;
            });
          },
          (error) => {
            console.error("GPS Watch error:", error);
            setIsRunningLocationDenied(true);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        
        watchIdRef.current = watchId;
      }
    });
  };

  const generateMapBase64Image = (
    coords: { lat: number; lng: number }[],
    distance: number,
    calories: number,
    earnedSns: number
  ): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 400);
      
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      for (let i = 0; i < 400; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 400);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(400, i);
        ctx.stroke();
      }
      
      if (coords.length > 0) {
        let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
        coords.forEach(c => {
          if (c.lat < minLat) minLat = c.lat;
          if (c.lat > maxLat) maxLat = c.lat;
          if (c.lng < minLng) minLng = c.lng;
          if (c.lng > maxLng) maxLng = c.lng;
        });
        
        const latRange = maxLat - minLat || 0.0001;
        const lngRange = maxLng - minLng || 0.0001;
        
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        coords.forEach((c, idx) => {
          const x = 40 + ((c.lng - minLng) / lngRange) * 320;
          const y = 360 - ((c.lat - minLat) / latRange) * 320;
          if (idx === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        
        const startX = 40 + ((coords[0].lng - minLng) / lngRange) * 320;
        const startY = 360 - ((coords[0].lat - minLat) / latRange) * 320;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(startX, startY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (coords.length > 1) {
          const lastIdx = coords.length - 1;
          const endX = 40 + ((coords[lastIdx].lng - minLng) / lngRange) * 320;
          const endY = 360 - ((coords[lastIdx].lat - minLat) / latRange) * 320;
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(endX, endY, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Courier New';
      ctx.fillText(`DISTANCE: ${distance.toFixed(1)}m`, 20, 30);
      ctx.fillText(`CALORIES: ${calories.toFixed(1)}kcal`, 20, 50);
      ctx.fillText(`EARNED: +${earnedSns} SNS`, 20, 70);
      ctx.fillText(activeRunningMode === 'treasure' ? 'SNS_HERO TREASURE MAP' : 'SNS_HERO RUNNING MAP', 20, 380);
    }
    
    return canvas.toDataURL('image/png');
  };

  const handleStopRunning = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Anti-cheat: check average speed
    const elapsedMs = Date.now() - runningStartTime;
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const distanceKm = runningDistance / 1000;
    const avgSpeedKmh = elapsedHours > 0 ? distanceKm / elapsedHours : 0;

    if (avgSpeedKmh > 20) {
      setShowAnticheatPopup(true);
      return;
    }

    // ÏÑ∏ÏÖò Í∏∞Ïó¨ Î≥¥ÏÉÅ ÎèôÍ∏∞Ìôî
    if (runningEarnedSns > 0) {
      recordMatchResult('win', runningEarnedSns, undefined, 'robot');
    }

    // Generate base64 Map Image
    const base64 = generateMapBase64Image(runningCoordinates, runningDistance, runningCalories, runningEarnedSns);
    setRunningMapImage(base64);

    // ÏöîÏïΩ Î™®Îã¨ ÌëúÏãú
    setShowRunningSyncSummaryModal(true);
  };



  // Îü¨Îãù ÎåÄÏ†Ñ Î∞è Î≥¥Î¨º ÎåÄÏ†Ñ ÏßÄÎèÑ Ï¥àÍ∏∞Ìôî useEffect
  useEffect(() => {
    if (gameState !== 'running' && gameState !== 'treasure') {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapMarkerRef.current = null;
        mapPolylineRef.current = null;
      }
      // Î≥¥Î¨ºÏÉÅÏûê ÎßàÏª§ Ï≤≠ÏÜå
      Object.values(treasureMarkersRef.current).forEach((marker: any) => {
        if (marker) marker.remove();
      });
      treasureMarkersRef.current = {};
      return;
    }

    const mapEl = document.getElementById('running-map');
    if (!mapEl || mapInstanceRef.current) return;

    // Ï¥àÍ∏∞ GPS ÏúÑÏπòÏ†ïÎ≥¥ ÌòπÏùÄ Í∏∞Î≥∏ ÏúÑÏπòÏ†ïÎ≥¥
    const initialLat = lastPositionRef.current?.lat || gpsCoords?.lat || 37.5665;
    const initialLng = lastPositionRef.current?.lng || gpsCoords?.lng || 126.9780;

    if (window.L) {
      const map = window.L.map('running-map', {
        center: [initialLat, initialLng],
        zoom: 17,
        zoomControl: false,
        attributionControl: false
      });

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;

      // ÎßåÏïΩ Í∏∞Ï°¥ Ï¢åÌëúÍ∞Ä ÏûàÎã§Î©¥ Ìè¥Î¶¨ÎùºÏù∏ Î∞è ÎßàÏª§ Ï¶âÏãú Í∑∏Î¶¨Í∏∞
      if (lastPositionRef.current) {
        mapMarkerRef.current = createRunningUserMarker(initialLat, initialLng);
      }

      // Î≥¥Î¨º ÎåÄÏ†Ñ Î™®ÎìúÏù¥Í≥† Î≥¥Î¨ºÏÉÅÏûê Î™©Î°ùÏù¥ ÏûàÎã§Î©¥ ÏßÄÎèÑÏóê ÎßàÏª§ ÌëúÏãú
      if (gameState === 'treasure' && treasureChests.length > 0) {
        // Í∏∞Ï°¥ ÎßàÏª§ Ï≤≠ÏÜå ÌõÑ Îã§Ïãú Í∑∏Î¶¨Í∏∞
        Object.values(treasureMarkersRef.current).forEach((marker: any) => {
          if (marker) marker.remove();
        });
        treasureMarkersRef.current = {};
        
        treasureChests.forEach(chest => {
          if (!chest.isOpened) {
            const pulseIconHtml = `
              <div class="relative flex items-center justify-center w-10 h-10">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span class="relative text-2xl">üéÅ</span>
              </div>
            `;
            const icon = window.L.divIcon({
              html: pulseIconHtml,
              className: 'custom-chest-icon',
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            });
            const marker = window.L.marker([chest.lat, chest.lng], { icon }).addTo(map);
            treasureMarkersRef.current[chest.id] = marker;
          }
        });
      }
    }
  }, [gameState, treasureChests]);


  const saveDefenseState = (isActive: boolean) => {
    localStorage.setItem('hero_defense_active_state', JSON.stringify({ isActive }));
  };

  // =========================================================================
  // DUNGEON MODE (2D FIELD DUNGEON & 5VS5 HEROES BATTLE) STATES & HELPERS
  // =========================================================================
  const [isDungeonActive, setIsDungeonActive] = useState<boolean>(false);
  const [dungeonPlayerPos, setDungeonPlayerPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [dungeonTargetPos, setDungeonTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [dungeonMonsters, setDungeonMonsters] = useState<FieldMonster[]>([]);

  const [isDungeonBattleActive, setIsDungeonBattleActive] = useState<boolean>(false);
  const [dungeonPlayerDeck, setDungeonPlayerDeck] = useState<FieldBattleCard[]>([]);
  const [dungeonOpponentDeck, setDungeonOpponentDeck] = useState<FieldBattleCard[]>([]);
  const [dungeonBattleStatus, setDungeonBattleStatus] = useState<'intro' | 'playing' | 'ended'>('intro');
  const [dungeonBattleTurn, setDungeonBattleTurn] = useState<'player' | 'opponent' | null>(null);
  const [dungeonBattleWinner, setDungeonBattleWinner] = useState<'player' | 'opponent' | null>(null);
  const [dungeonBattleIsBoss, setDungeonBattleIsBoss] = useState<boolean>(false);
  const [dungeonBattleBossCardId, setDungeonBattleBossCardId] = useState<number | null>(null);
  const [dungeonBattleLog, setDungeonBattleLog] = useState<string[]>([]);

  const [dungeonAttackingCardId, setDungeonAttackingCardId] = useState<string | null>(null);
  const [dungeonAttackingTargetId, setDungeonAttackingTargetId] = useState<string | null>(null);
  const [dungeonSelectedStat, setDungeonSelectedStat] = useState<string | null>(null);
  const [dungeonDamagePopups, setDungeonDamagePopups] = useState<DamagePopup[]>([]);
  const [showDungeonBattleResultModal, setShowDungeonBattleResultModal] = useState<boolean>(false);
  const [dungeonBattleReward, setDungeonBattleReward] = useState<number>(0);
  const [isDirectAiBattle, setIsDirectAiBattle] = useState<boolean>(false);

  const saveDungeonState = (isActive: boolean, playerPos?: { x: number; y: number }) => {
    localStorage.setItem('hero_dungeon_active_state', JSON.stringify({
      isActive,
      playerPos: playerPos || dungeonPlayerPos
    }));
  };



  const initDungeonMonsters = () => {
    const keys = Object.keys(CARD_DATABASE).map(Number).filter(id => id < 100);
    const monsters: FieldMonster[] = [];
    for (let i = 0; i < 3; i++) {
      const cardId = keys[Math.floor(Math.random() * keys.length)] || 1;
      let mx = Math.random() * 80 + 10;
      let my = Math.random() * 80 + 10;
      while (Math.abs(mx - 50) < 15 && Math.abs(my - 50) < 15) {
        mx = Math.random() * 80 + 10;
        my = Math.random() * 80 + 10;
      }
      monsters.push({
        id: `dungeon-monster-${i}-${Date.now()}`,
        x: mx,
        y: my,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        cardId
      });
    }
    setDungeonMonsters(monsters);
  };

  const handleEnterDungeonCave = (caveName: string) => {
    const isBossMatch = Math.random() < 0.10;
    let bossCardId = 110;
    if (caveName === 'north') bossCardId = 110;
    else if (caveName === 'south') bossCardId = 60;
    else if (caveName === 'west') bossCardId = 100;
    else if (caveName === 'east') bossCardId = 70;

    if (isBossMatch) {
      // Ïø®Îã§Ïö¥ Ï≤¥ÌÅ¨
      const cooldowns = JSON.parse(localStorage.getItem('hero_boss_cooldowns') || '{}');
      const lastFight = cooldowns[bossCardId] || 0;
      const hoursLimit = 10;
      const isCooldown = Date.now() - lastFight < hoursLimit * 60 * 60 * 1000;

      if (isCooldown) {
        triggerAlert(t('field_boss_cooldown_warn', language), language === 'ko' ? 'Í≤ΩÍ≥†' : 'WARNING');
        const keys = Object.keys(CARD_DATABASE).map(Number).filter(id => id < 100);
        const randomCardId = keys[Math.floor(Math.random() * keys.length)] || 1;
        startDungeonBattle(false, randomCardId);
        return;
      }

      const bossCard = CARD_DATABASE[bossCardId];
      if (!bossCard) return;

      const oppPower = Math.ceil((calculatedTotalPower || 1000) * 1.5);
      const bossCardData = {
        ...bossCard,
        id: `dungeon-boss-${Date.now()}`,
        owner: 'ai' as const,
        bonusPower: 0,
        xp: 0,
        imageIndex: bossCardId,
        isFinalBoss: true
      };
      const baseDeck = ensureUniqueDeck([bossCardData, ...generateUniqueDeck(4)], 5);

      setSelectedOpponent({
        id: `dungeon-boss-${bossCard.title_en}-${Date.now()}`,
        name: language === 'ko' ? bossCard.title : (bossCard.title_dis || bossCard.title_en),
        totalPower: oppPower,
        wins: 0,
        losses: 0,
        draws: 0,
        sns: 0,
        deck: baseDeck
      });

      if (setIsAutoBattle) {
        setIsAutoBattle(true);
      }

      setDungeonBattleBossCardId(bossCardId);
      setGameState('preMatch');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    } else {
      const keys = Object.keys(CARD_DATABASE).map(Number).filter(id => id < 100);
      const randomCardId = keys[Math.floor(Math.random() * keys.length)] || 1;
      startDungeonBattle(false, randomCardId);
    }
  };

  const startDungeonBattle = (isBoss: boolean, targetCardId: number) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setDungeonBattleIsBoss(isBoss);
    setDungeonBattleBossCardId(targetCardId);
    setDungeonBattleStatus('intro');
    setDungeonBattleWinner(null);
    setDungeonBattleLog([t('field_battle_start', language)]);

    let pCards = [...playerDeck];
    if (pCards.length === 0) {
      const keys = Object.keys(CARD_DATABASE).map(Number).slice(0, 5);
      pCards = keys.map(k => CARD_DATABASE[k]);
    }
    while (pCards.length < 5) {
      const keys = Object.keys(CARD_DATABASE).map(Number);
      const randId = keys[Math.floor(Math.random() * keys.length)];
      pCards.push(CARD_DATABASE[randId]);
    }
    pCards = pCards.slice(0, 5);
    const pDeck: FieldBattleCard[] = pCards.map((c, idx) => {
      const cardWithImg = {
        ...c,
        imageIndex: c.imageIndex !== undefined ? c.imageIndex : (c.id && typeof c.id === 'number' ? c.id : 1)
      };
      const maxHp = getCardPower(cardWithImg);
      return {
        id: `dp-${idx}-${Date.now()}`,
        card: cardWithImg,
        hp: maxHp,
        maxHp: maxHp,
        side: 'player',
        originalIndex: idx
      };
    });

    const primaryCard = CARD_DATABASE[targetCardId] || CARD_DATABASE[1];
    const primaryCardWithImg = {
      ...primaryCard,
      imageIndex: targetCardId
    };

    const keys = Object.keys(CARD_DATABASE).map(Number).filter(id => id < 100 && id !== targetCardId);
    const otherCards: CardData[] = [];
    for (let i = 0; i < 4; i++) {
      const randId = keys[Math.floor(Math.random() * keys.length)] || 1;
      const dbC = CARD_DATABASE[randId];
      otherCards.push({
        ...dbC,
        imageIndex: randId
      } as any);
    }
    const oCards = [otherCards[0], otherCards[1], primaryCardWithImg, otherCards[2], otherCards[3]];
    const oDeck = oCards.map((c, idx) => {
      const maxHp = getCardPower(c as any);
      return {
        id: `do-${idx}-${Date.now()}`,
        card: c as any,
        hp: maxHp,
        maxHp: maxHp,
        side: 'opponent',
        originalIndex: idx
      };
    });

    setDungeonPlayerDeck(pDeck);
    setDungeonOpponentDeck(oDeck);
    setIsDungeonBattleActive(true);

    setTimeout(() => {
      const isPlayerFirst = Math.random() < 0.5;
      setDungeonBattleTurn(isPlayerFirst ? 'player' : 'opponent');
      setDungeonBattleLog(prev => [...prev, `${t('field_first_strike', language)} -> ${isPlayerFirst ? t('field_turn_player', language) : t('field_turn_ai', language)}`]);
      setDungeonBattleStatus('playing');
    }, 2000);
  };

  const handleDungeonBattleEnd = (winner: 'player' | 'opponent') => {
    setDungeonBattleWinner(winner);
    setDungeonBattleStatus('ended');

    let reward = 0;
    if (winner === 'player') {
      reward = 60;
      recordMatchResult('win', reward, undefined, 'robot');
    } else {
      recordMatchResult('loss', 0, undefined, 'robot');
    }

    setDungeonBattleReward(reward);
    setShowDungeonBattleResultModal(true);
  };

  const closeDungeonBattleResult = () => {
    setShowDungeonBattleResultModal(false);
    setIsDungeonBattleActive(false);
    setGameState('modeSelect');
    setIsDungeonActive(false);
    saveDungeonState(false);
  };

  useEffect(() => {
    // Discarded legacy dungeon collision loop
    return;
  }, []);

  useEffect(() => {
    if (!isDungeonBattleActive || dungeonBattleStatus !== 'playing' || !dungeonBattleTurn) return;

    const roundInterval = setTimeout(() => {
      const alivePlayer = dungeonPlayerDeck.filter(c => c.hp > 0);
      const aliveOpponent = dungeonOpponentDeck.filter(c => c.hp > 0);

      if (alivePlayer.length === 0) {
        handleDungeonBattleEnd('opponent');
        return;
      }
      if (aliveOpponent.length === 0) {
        handleDungeonBattleEnd('player');
        return;
      }

      let attacker: FieldBattleCard;
      let target: FieldBattleCard;

      if (dungeonBattleTurn === 'player') {
        attacker = alivePlayer[Math.floor(Math.random() * alivePlayer.length)];
        target = aliveOpponent[Math.floor(Math.random() * aliveOpponent.length)];
      } else {
        attacker = aliveOpponent[Math.floor(Math.random() * aliveOpponent.length)];
        target = alivePlayer[Math.floor(Math.random() * alivePlayer.length)];
      }

      const directions = ['top', 'right', 'bottom', 'left'];
      const randomDir = directions[Math.floor(Math.random() * directions.length)];
      
      let statVal = 0;
      if (randomDir === 'top') statVal = getCardStatWithBonus(attacker.card, 0);
      else if (randomDir === 'right') statVal = getCardStatWithBonus(attacker.card, 1);
      else if (randomDir === 'bottom') statVal = getCardStatWithBonus(attacker.card, 2);
      else if (randomDir === 'left') statVal = getCardStatWithBonus(attacker.card, 3);
      
      if (!statVal || statVal <= 0) {
        statVal = 5;
      }
      
      const damage = statVal;
      
      setDungeonAttackingCardId(attacker.id);
      setDungeonAttackingTargetId(target.id);
      setDungeonSelectedStat(randomDir);

      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

      setTimeout(() => {
        const popupId = `popup-dungeon-${Date.now()}`;
        setDungeonDamagePopups(prev => [...prev, {
          id: popupId,
          targetCardId: target.id,
          amount: damage,
          direction: randomDir
        }]);

        setTimeout(() => {
          setDungeonDamagePopups(prev => prev.filter(p => p.id !== popupId));
        }, 1000);

        if (dungeonBattleTurn === 'player') {
          setDungeonOpponentDeck(prev => {
            const updated = prev.map(c => {
              if (c.id === target.id) {
                const newHp = Math.max(0, c.hp - damage);
                return { ...c, hp: newHp };
              }
              return c;
            });
            return updated;
          });
        } else {
          setDungeonPlayerDeck(prev => {
            const updated = prev.map(c => {
              if (c.id === target.id) {
                const newHp = Math.max(0, c.hp - damage);
                return { ...c, hp: newHp };
              }
              return c;
            });
            return updated;
          });
        }

        const attackerName = language === 'ko' ? attacker.card.title : (attacker.card.title_dis || attacker.card.title_en);
        const targetName = language === 'ko' ? target.card.title : (target.card.title_dis || target.card.title_en);
        const dirLabel = randomDir.toUpperCase();
        setDungeonBattleLog(prev => [
          ...prev,
          `‚öîÔ∏è ${attackerName} (${dirLabel}: ${statVal}) -> ${targetName} : -${damage} HP`
        ]);

        setTimeout(() => {
          setDungeonAttackingCardId(null);
          setDungeonAttackingTargetId(null);
          setDungeonSelectedStat(null);
          setDungeonBattleTurn(prev => prev === 'player' ? 'opponent' : 'player');
        }, 300);

      }, 350);

    }, 800);

    return () => clearTimeout(roundInterval);
  }, [isDungeonBattleActive, dungeonBattleStatus, dungeonBattleTurn, dungeonPlayerDeck, dungeonOpponentDeck]);

  const storyActData = [
    {
      id: 1,
      title: t('story_act1_title', language),
      desc: t('story_act1_desc', language),
      climax: t('story_act1_climax', language),
      midBossId: 101, // Dragon1 (Baby Dragon)
      midBossTaunt: t('story_boss_dragon1', language),
      finalBossId: 110, // Dragon10 (Black Dragon)
      finalBossTaunt: t('story_boss_dragon10', language),
      reward: 50
    },
    {
      id: 2,
      title: t('story_act2_title', language),
      desc: t('story_act2_desc', language),
      climax: t('story_act2_climax', language),
      midBossId: 51, // Undead1 (Zombi)
      midBossTaunt: t('story_boss_undead1', language),
      finalBossId: 60, // Undead10 (Death Knight)
      finalBossTaunt: t('story_boss_undead10', language),
      reward: 100
    },
    {
      id: 3,
      title: t('story_act3_title', language),
      desc: t('story_act3_desc', language),
      climax: t('story_act3_climax', language),
      midBossId: 91, // Robot1 (Small Robot A)
      midBossTaunt: t('story_boss_robot1', language),
      finalBossId: 100, // Robot10 (Ultimate Weapon)
      finalBossTaunt: t('story_boss_robot10', language),
      reward: 150
    },
    {
      id: 4,
      title: t('story_act4_title', language),
      desc: t('story_act4_desc', language),
      climax: t('story_act4_climax', language),
      midBossId: 61, // Elf1 (Elf Soldier)
      midBossTaunt: t('story_boss_elf1', language),
      finalBossId: 70, // Elf10 (Demon Hunter)
      finalBossTaunt: t('story_boss_elf10', language),
      reward: 300
    }
  ];

  const startStoryMode = () => {
    setIsStoryActive(true);
    setGameState('story');
    saveStoryProgress(storyAct, storyStep, true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const startStoryMatch = (bossCardId: number, isFinal: boolean) => {
    const bossCard = CARD_DATABASE[bossCardId];
    if (!bossCard) return;

    const actDifficultyBuff = (storyAct + 1) * 200;
    const oppPower = Math.ceil((calculatedTotalPower || 1000) * (0.8 + storyAct * 0.1) + actDifficultyBuff);
    
    const bossCardData = {
      ...bossCard,
      id: `story-boss-${Date.now()}`,
      owner: 'ai' as const,
      bonusPower: 0,
      xp: 0,
      imageIndex: bossCardId,
      isMidBoss: !isFinal,
      isFinalBoss: isFinal
    };
    const baseDeck = ensureUniqueDeck([bossCardData, ...generateUniqueDeck(4)], 5);

    setSelectedOpponent({
      id: `story-boss-${bossCard.title_en}-${Date.now()}`,
      name: language === 'ko' ? bossCard.title : (bossCard.title_dis || bossCard.title_en),
      totalPower: oppPower,
      wins: 0,
      losses: 0,
      draws: 0,
      sns: 0,
      deck: baseDeck
    });

    if (setIsAutoBattle) {
      setIsAutoBattle(true);
    }

    setGameState('preMatch');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  useEffect(() => {
    if (gameState !== 'story' || !isStoryAutoPlay) return;
    const timer = setTimeout(() => {
      if (storyStep === 0) {
        const nextStep = 1;
        setStoryStep(nextStep);
        saveStoryProgress(storyAct, nextStep, true);
      } else if (storyStep === 1 || storyStep === 2) {
        const actInfo = storyActData[storyAct];
        if (actInfo) {
          const bossId = storyStep === 1 ? actInfo.midBossId : actInfo.finalBossId;
          startStoryMatch(bossId, storyStep === 2);
        }
      } else if (storyStep === 3) {
        if (storyAct === 3) {
          setIsStoryFinished(true);
        } else {
          const nextAct = storyAct + 1;
          setStoryAct(nextAct);
          setStoryStep(0);
          saveStoryProgress(nextAct, 0, true);
        }
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [gameState, isStoryAutoPlay, storyAct, storyStep]);

  const handleSkipStory = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (storyStep === 0) {
      const nextStep = 1;
      setStoryStep(nextStep);
      saveStoryProgress(storyAct, nextStep, true);
    } else if (storyStep === 1 || storyStep === 2) {
      const actInfo = storyActData[storyAct];
      if (actInfo) {
        const bossId = storyStep === 1 ? actInfo.midBossId : actInfo.finalBossId;
        startStoryMatch(bossId, storyStep === 2);
      }
    } else if (storyStep === 3) {
      if (storyAct === 3) {
        setIsStoryFinished(true);
      } else {
        const nextAct = storyAct + 1;
        setStoryAct(nextAct);
        setStoryStep(0);
        saveStoryProgress(nextAct, 0, true);
      }
    }
  };

  const runStoryOutcome = (playerWon: boolean) => {
    if (!isStoryActive) return;

    const actInfo = storyActData[storyAct];

    if (playerWon) {
      if (storyStep === 1) {
        const nextStep = 2;
        setStoryStep(nextStep);
        saveStoryProgress(storyAct, nextStep, true);
      } else if (storyStep === 2) {
        const nextStep = 3;
        setStoryStep(nextStep);
        saveStoryProgress(storyAct, nextStep, true);
        
        const prize = actInfo.reward;
        setStoryReward(prize);
        const storyBattleId = `story-act-${storyAct}-step-${nextStep}`;
        completeStoryBattle(storyBattleId);
        
        // Award story act special bonuses
        setStoryBonusItem(null);
        if (storyAct === 0 || storyAct === 1) {
          if (updateStats) {
            const currentSp = userStats?.skillPoints || 0;
            updateStats({ skillPoints: currentSp + 1 });
          }
        } else if (storyAct === 2 || storyAct === 3) {
          if (addItem) {
            const newItem = addItem('rare');
            if (newItem) {
              setStoryBonusItem(newItem);
            }
          }
        }
        
        recordMatchResult('win', prize, undefined, 'robot');
        setShowStoryResultModal(true);
      }
    }
  };
  
  // =========================================================================
  // TOURNAMENT STATES & HELPER FUNCTIONS
  // =========================================================================
  const [tournamentRound, setTournamentRound] = useState<number>(0);
  const [tournamentRounds, setTournamentRounds] = useState<TournamentMatch[][]>([]);
  const [isTournamentActive, setIsTournamentActive] = useState<boolean>(false);
  const [tournamentPrize, setTournamentPrize] = useState<number>(0);
  const [isPlayerEliminated, setIsPlayerEliminated] = useState<boolean>(false);
  const [isPlayerWinner, setIsPlayerWinner] = useState<boolean>(false);
  const [showTournamentResultModal, setShowTournamentResultModal] = useState<boolean>(false);
  const [justAdvanced, setJustAdvanced] = useState<boolean>(false);
  const [activeTournamentTab, setActiveTournamentTab] = useState<number>(0);

  const startTournament = () => {
    const aiParticipants: TournamentParticipant[] = Array.from({ length: 15 }, (_, i) => ({
      id: `ai-${i}-${Date.now()}`,
      name: generateAiName(),
      isPlayer: false,
      power: Math.ceil((calculatedTotalPower || 1000) * (0.8 + Math.random() * 0.4))
    }));

    const player: TournamentParticipant = {
      id: 'player',
      name: effectiveUser?.displayName || 'PLAYER',
      isPlayer: true,
      power: calculatedTotalPower || 1000
    };

    const all = [player, ...aiParticipants];
    const shuffled = [...all].sort(() => Math.random() - 0.5);

    const matches16: TournamentMatch[] = [];
    for (let i = 0; i < 16; i += 2) {
      matches16.push({
        p1: shuffled[i],
        p2: shuffled[i + 1],
        winner: null
      });
    }

    const matches8: TournamentMatch[] = Array.from({ length: 4 }, () => ({ p1: null, p2: null, winner: null }));
    const matches4: TournamentMatch[] = Array.from({ length: 2 }, () => ({ p1: null, p2: null, winner: null }));
    const matches2: TournamentMatch[] = Array.from({ length: 1 }, () => ({ p1: null, p2: null, winner: null }));

    setTournamentRounds([matches16, matches8, matches4, matches2]);
    setTournamentRound(0);
    setActiveTournamentTab(0);
    setIsTournamentActive(true);
    setIsPlayerEliminated(false);
    setIsPlayerWinner(false);
    setTournamentPrize(0);
    setJustAdvanced(false);
    setGameState('tournament');
  };

  const startTournamentMatch = () => {
    const currentMatches = tournamentRounds[tournamentRound];
    const playerMatch = currentMatches.find(m => m.p1?.isPlayer || m.p2?.isPlayer);
    if (!playerMatch) return;

    const opp = playerMatch.p1?.isPlayer ? playerMatch.p2 : playerMatch.p1;
    if (!opp) return;

    setSelectedOpponent({
      id: opp.id,
      name: opp.name,
      totalPower: opp.power,
      wins: 0,
      losses: 0,
      draws: 0,
      sns: 0,
      deck: generateUniqueDeck(5)
    });

    if (setIsAutoBattle) {
      setIsAutoBattle(true);
    }

    setGameState('preMatch');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const runTournamentRound = (playerWon: boolean) => {
    if (!isTournamentActive) return;

    const currentMatches = [...tournamentRounds[tournamentRound]];
    const playerMatchIdx = currentMatches.findIndex(m => m.p1?.isPlayer || m.p2?.isPlayer);
    if (playerMatchIdx === -1) return;

    const playerMatch = currentMatches[playerMatchIdx];
    const opponent = playerMatch.p1?.isPlayer ? playerMatch.p2 : playerMatch.p1;
    const playerPart = playerMatch.p1?.isPlayer ? playerMatch.p1 : playerMatch.p2;

    if (playerWon) {
      playerMatch.winner = playerPart;
      playerMatch.score1 = playerMatch.p1?.isPlayer ? 6 : 3;
      playerMatch.score2 = playerMatch.p1?.isPlayer ? 3 : 6;
    } else {
      playerMatch.winner = opponent;
      playerMatch.score1 = playerMatch.p1?.isPlayer ? 3 : 6;
      playerMatch.score2 = playerMatch.p1?.isPlayer ? 6 : 3;
    }

    currentMatches.forEach((m, idx) => {
      if (idx === playerMatchIdx) return;
      if (!m.p1 || !m.p2) return;
      const p1Chance = m.p1.power / (m.p1.power + m.p2.power);
      const isP1Winner = Math.random() < p1Chance;
      m.winner = isP1Winner ? m.p1 : m.p2;
      m.score1 = isP1Winner ? 5 : 4;
      m.score2 = isP1Winner ? 4 : 5;
    });

    const nextRound = tournamentRound + 1;
    const updatedRounds = [...tournamentRounds];
    updatedRounds[tournamentRound] = currentMatches;

    if (playerWon) {
      if (tournamentRound === 3) {
        setIsPlayerWinner(true);
        setTournamentPrize(150);
        recordMatchResult('win', 150, undefined, 'robot');
        setShowTournamentResultModal(true);
      } else {
        const nextMatches = [...updatedRounds[nextRound]];
        for (let i = 0; i < currentMatches.length; i += 2) {
          const m1 = currentMatches[i];
          const m2 = currentMatches[i+1];
          const nextMatchIdx = Math.floor(i / 2);
          nextMatches[nextMatchIdx] = {
            p1: m1.winner,
            p2: m2.winner,
            winner: null
          };
        }
        updatedRounds[nextRound] = nextMatches;
        setTournamentRounds(updatedRounds);
        setTournamentRound(nextRound);
        setActiveTournamentTab(nextRound);
        setJustAdvanced(true);
        setTimeout(() => setJustAdvanced(false), 2000);
      }
    } else {
      setIsPlayerEliminated(true);
      let prize = 10;
      if (tournamentRound === 1) prize = 30;
      if (tournamentRound === 2) prize = 60;
      if (tournamentRound === 3) prize = 90;
      
      setTournamentPrize(prize);
      recordMatchResult('win', prize, undefined, 'robot');
      setShowTournamentResultModal(true);
    }
  };

  const handleExitMatch = (isForfeit = false) => {
    setRematchCountdown(null);
    if (setIsAutoBattle) setIsAutoBattle(false);
    resetQteState();
    
    setCurrentMatchId(null);
    setMatchInfo(null);
    setBoard(Array(9).fill(null));
    setPlayerHand([]);
    setOpponentHand([]);
    setGameOver(false);
    setCheckingIdx(-1);
    setIsEvaluating(false);

    if (isStoryActive) {
      const didPlayerWin = !isForfeit && winner === 'player';
      setWinner(null);
      runStoryOutcome(didPlayerWin);
      setGameState('story');
    } else if (isDungeonActive) {
      const didPlayerWin = !isForfeit && winner === 'player';
      setWinner(null);
      if (dungeonBattleBossCardId) {
        if (didPlayerWin) {
          const cooldowns = JSON.parse(localStorage.getItem('hero_boss_cooldowns') || '{}');
          cooldowns[dungeonBattleBossCardId] = Date.now();
          localStorage.setItem('hero_boss_cooldowns', JSON.stringify(cooldowns));
          recordMatchResult('win', 400, undefined, 'robot');
          triggerAlert(
            language === 'ko' ? "Î≥¥Ïä§Î•º Ï≤òÏπòÌñàÏäµÎãàÎã§! 400 SNSÎ•º ÌöçÎìùÌï©ÎãàÎã§." : "Boss defeated! Earned 400 SNS.",
            language === 'ko' ? 'ÏÑ±Í≥µ' : 'SUCCESS'
          );
        } else {
          recordMatchResult('loss', 0, undefined, 'robot');
        }
        setDungeonBattleBossCardId(null);
      }
      setGameState('modeSelect');
      setIsDungeonActive(false);
      saveDungeonState(false);
    } else if (isTournamentActive) {
      const didPlayerWin = !isForfeit && winner === 'player';
      setWinner(null);
      runTournamentRound(didPlayerWin);
      setGameState('tournament');
    } else {
      setWinner(null);
      if (battleType === 'pvp_attack') {
        onBack();
      } else if (isDirectAiBattle) {
        setIsDirectAiBattle(false);
        setGameState('modeSelect');
      } else {
        setGameState('lobby');
      }
    }
  };
  const [workoutDistance, setWorkoutDistance] = useState<number>(0);
  const [workoutCalories, setWorkoutCalories] = useState<number>(0);
  const prevGpsCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const botMarkersRef = useRef<Record<string, L.Marker>>({});



  const [isRecordingResult, setIsRecordingResult] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<Character | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [isHoveringOpponent, setIsHoveringOpponent] = useState(false);
  const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [elementalBoard, setElementalBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [firstTurn, setFirstTurn] = useState<'player' | 'ai'>('player');
  const [turnTimerSeconds, setTurnTimerSeconds] = useState<number>(15);
  const turnMaxSeconds = 15;
  const [showPreviewDeck, setShowPreviewDeck] = useState(false);
  const [previewDeck, setPreviewDeck] = useState<CardData[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | 'draw' | null>(null);
  const [showBattleShareTemplate, setShowBattleShareTemplate] = useState(false);

  useEffect(() => {
    if (!gameOver) {
      setShowBattleShareTemplate(false);
    }
  }, [gameOver]);

  // Card Image & Texture Pre-caching for Low-Spec Performance (Non-blocking background warm-up)
  const cachedSourcesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only pre-cache when entering match searching or preMatch, never repeatedly during active 'playing' turn updates
    if (gameState === 'searching' || gameState === 'preMatch') {
      const imageSources = new Set<string>();
      imageSources.add(getAssetUrl('/cards1.png'));
      imageSources.add(getAssetUrl('/card2.png'));
      imageSources.add(getAssetUrl('/cards2.png'));

      (playerDeck || []).forEach((card) => {
        if (card && card.imageUrl) {
          imageSources.add(getAssetUrl(card.imageUrl));
        }
      });

      if (selectedOpponent && selectedOpponent.deck) {
        selectedOpponent.deck.forEach((card) => {
          if (card && card.imageUrl) {
            imageSources.add(getAssetUrl(card.imageUrl));
          }
        });
      }

      // Filter already cached images
      const uncachedSources = Array.from(imageSources).filter(src => !cachedSourcesRef.current.has(src));
      
      if (uncachedSources.length === 0) {
        setIsTextureCaching(false);
        return;
      }

      setIsTextureCaching(true);
      setTextureCacheProgress(20);

      let loadedCount = 0;
      const totalCount = uncachedSources.length;
      let isMounted = true;

      const handleSingleLoaded = (src: string) => {
        cachedSourcesRef.current.add(src);
        if (!isMounted) return;
        loadedCount++;
        const progress = Math.min(100, Math.round((loadedCount / totalCount) * 100));
        setTextureCacheProgress(progress);
        if (loadedCount >= totalCount) {
          if (isMounted) setIsTextureCaching(false);
        }
      };

      uncachedSources.forEach((src) => {
        const img = new Image();
        img.onload = () => handleSingleLoaded(src);
        img.onerror = () => handleSingleLoaded(src);
        img.src = src;
      });

      // Ultra-fast safety timeout (300ms max) to ensure UI never freezes
      const timeout = setTimeout(() => {
        if (isMounted) {
          uncachedSources.forEach(src => cachedSourcesRef.current.add(src));
          setIsTextureCaching(false);
        }
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(timeout);
      };
    } else {
      setIsTextureCaching(false);
    }
  }, [gameState, playerDeck, selectedOpponent]);

  // Ï†ÑÌà¨ ÏôÑÎ£å ‚Üí ÌòÑÏû¨ Ïä§ÌÜ†Î¶¨ Ïª®ÌÖçÏä§Ìä∏ Í∏∞Ï§ÄÏúºÎ°ú 1ÌöåÎßå ÏßÑÌñâÎèÑ Í∞±Ïã†
  useEffect(() => {
    if (!gameOver || winner !== 'player' || !currentStoryBattleContext) return;

    if (!hasCompletedStoryBattle(currentStoryBattleContext.battleId)) {
      completeStoryBattle(currentStoryBattleContext.battleId);
    }

  }, [
    completeStoryBattle,
    currentStoryBattleContext,
    gameOver,
    hasCompletedStoryBattle,
    winner,
  ]);

  const [rematchCountdown, setRematchCountdown] = useState<number | null>(null);
  const [defeatExitCountdown, setDefeatExitCountdown] = useState<number | null>(null);
  const [dungeonDefeatCountdown, setDungeonDefeatCountdown] = useState<number | null>(null);
  const [rewardEarned, setRewardEarned] = useState<number>(0);
  const [battleType, setBattleType] = useState<'robot' | 'user' | 'pvp_attack' | 'matgo'>('robot');
  const [matgoDeck, setMatgoDeck] = useState<CardData[]>([]);
  const [matgoBoardStacks, setMatgoBoardStacks] = useState<{ [key: number]: CardData[] }>({});
  const [matgoScores, setMatgoScores] = useState<{ player: number; ai: number }>({ player: 0, ai: 0 });
  const [matgoMiddleCard, setMatgoMiddleCard] = useState<CardData | null>(null);
  const [isShowingMatgoMiddle, setIsShowingMatgoMiddle] = useState<boolean>(false);
  const [showInsufficientPopup, setShowInsufficientPopup] = useState(false);
  const [showOverwhelmingEffect, setShowOverwhelmingEffect] = useState(false);
  const [showStreakEffect, setShowStreakEffect] = useState(false);
  const [currentWinStreakDisplay, setCurrentWinStreakDisplay] = useState(0);
  
  const [hasExhausted, setHasExhausted] = useState(false);
  const [isRoarActive, setIsRoarActive] = useState(false);
  const [skillCooldowns, setSkillCooldowns] = useState<Record<number, number>>({});
  
  // Custom states for 8 Battle Roar / Item Skills
  const [activeTrapMode, setActiveTrapMode] = useState<'weaken_trap' | 'reinforce_trap' | 'change_opponent' | 'change_player' | null>(null);
  const [customWaveEffect, setCustomWaveEffect] = useState<'red' | 'blue' | 'yellow' | 'purple' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [fireGlowCells, setFireGlowCells] = useState<Set<number>>(new Set());
  const [waterGlowCells, setWaterGlowCells] = useState<Set<number>>(new Set());
  
  // Trap states per board cell
  const [boardTraps, setBoardTraps] = useState<Record<number, 'purple' | 'red'>>({});
  // Hand card long press / zoom preview (Item 51)
  const [previewHandCard, setPreviewHandCard] = useState<CardData | null>(null);

  // Battle Result Summary Metrics
  const [totalDamageDealt, setTotalDamageDealt] = useState<number>(0);
  const [totalDamageReceived, setTotalDamageReceived] = useState<number>(0);
  const [showPostBattleSummaryModal, setShowPostBattleSummaryModal] = useState<boolean>(false);
  const [showElementAdvantageModal, setShowElementAdvantageModal] = useState<boolean>(false);
  const [lastBattleSummaryData, setLastBattleSummaryData] = useState<LastBattleSummaryData | null>(() => {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('hero_last_ai_battle_summary') : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [leveledUpCards, setLeveledUpCards] = useState<LeveledUpCardInfo[]>([]);
  const [allDeckCardsProgress, setAllDeckCardsProgress] = useState<LeveledUpCardInfo[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const hasActiveCooldown = Object.values(skillCooldowns).some(c => (c as number) > 0);
    if (!hasActiveCooldown) return;

    const timer = setInterval(() => {
      setSkillCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(key => {
          const id = Number(key);
          if (next[id] > 0) {
            next[id] = next[id] - 1;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [skillCooldowns]);

  const getAvailableSkills = useCallback(() => {
    const activeSkills: number[] = [];
    const equippedItemIds = new Set<number>();
    
    playerDeck.forEach(card => {
      if (card && card.equipment) {
        Object.values(card.equipment).forEach((item: any) => {
          if (item && typeof item.imageIndex === 'number') {
            equippedItemIds.add(item.imageIndex);
          }
        });
      }
    });

    if ([8, 9, 10, 18].some(id => equippedItemIds.has(id))) activeSkills.push(1);
    if ([19, 20, 24, 25].some(id => equippedItemIds.has(id))) activeSkills.push(2);
    if ([26, 31, 32, 40].some(id => equippedItemIds.has(id))) activeSkills.push(3);
    if ([41, 42, 45, 50].some(id => equippedItemIds.has(id))) activeSkills.push(4);
    if ([62, 63, 64, 65].some(id => equippedItemIds.has(id))) activeSkills.push(5);
    if ([66, 67, 68, 69].some(id => equippedItemIds.has(id))) activeSkills.push(6);
    if ([70, 71, 74, 75].some(id => equippedItemIds.has(id))) activeSkills.push(7);
    if ([76, 77, 86, 87].some(id => equippedItemIds.has(id))) activeSkills.push(8);

    // Ïä§ÌÜ†Î¶¨ Î™®Îìú ÎåÄÏ†ÑÏù¥Í±∞ÎÇò, Ïû•ÎπÑÎ°ú Í∞êÏßÄÎêú ÌôúÏÑ± Ïä§ÌÇ¨Ïù¥ ÏóÜÎäî Í≤ΩÏö∞ Í∏∞Î≥∏ Ïä§ÌÇ¨(1: Í∞ïÌôî Ìï®ÏÑ±, 5: ÏïΩÌôî Ìï®Ï†ï, 8: Ï≤¥Ïù∏ÏßÄ ÎÇ¥Ïπ¥Îìú) Ï†úÍ≥µ
    if (activeSkills.length === 0 || gameState === 'story' || storyState.isActive) {
      return [1, 5, 8];
    }

    return activeSkills.slice(0, 4); // max 4 grid
  }, [playerDeck, gameState, storyState.isActive]);

  const handleExecuteSkill = (skillId: number) => {
    const currentCooldown = skillCooldowns[skillId] || 0;
    if (currentCooldown > 0 || isRoarActive) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/1190/1190-preview.mp3');
    setSkillCooldowns(prev => ({ ...prev, [skillId]: 5 })); // 5 seconds cooldown for this specific skill

    switch (skillId) {
      case 1: // Í∞ïÌôî Ìï®ÏÑ±
        setCustomWaveEffect('red');
        setIsRoarActive(true);
        setTimeout(() => {
          setCustomWaveEffect(null);
          setIsRoarActive(false);
        }, 1500);

        setBoard(prev => {
          const next = [...prev];
          const newGlow = new Set<number>();
          next.forEach((card, idx) => {
            if (card && card.owner === 'player') {
              newGlow.add(idx);
              next[idx] = {
                ...card,
                stats: card.stats.map(v => v + 1) as [number, number, number, number]
              };
            }
          });
          setFireGlowCells(newGlow);
          setTimeout(() => setFireGlowCells(new Set()), 3000);
          return next;
        });
        break;

      case 2: // ÏïΩÌôî Ï†ÄÏ£º
        setCustomWaveEffect('blue');
        setIsRoarActive(true);
        setTimeout(() => {
          setCustomWaveEffect(null);
          setIsRoarActive(false);
        }, 1500);

        setBoard(prev => {
          const next = [...prev];
          const newGlow = new Set<number>();
          next.forEach((card, idx) => {
            if (card && card.owner === 'ai') {
              newGlow.add(idx);
              next[idx] = {
                ...card,
                stats: card.stats.map(v => Math.max(0, v - 1)) as [number, number, number, number]
              };
            }
          });
          setWaterGlowCells(newGlow);
          setTimeout(() => setWaterGlowCells(new Set()), 3000);
          return next;
        });
        break;

      case 3: // Î≥ÄÌôî Ìï®ÏÑ±
        setCustomWaveEffect('yellow');
        setIsRoarActive(true);
        setTimeout(() => {
          setCustomWaveEffect(null);
          setIsRoarActive(false);
        }, 1500);

        setBoard(prev => {
          const next = [...prev];
          next.forEach((card, idx) => {
            if (card && card.owner === 'player') {
              const [u, r, d, l] = card.stats;
              next[idx] = {
                ...card,
                stats: [l, u, r, d] // Rotate clockwise
              };
            }
          });
          return next;
        });
        break;

      case 4: // Î≥ÄÌôî Ï†ÄÏ£º
        setCustomWaveEffect('purple');
        setIsRoarActive(true);
        setTimeout(() => {
          setCustomWaveEffect(null);
          setIsRoarActive(false);
        }, 1500);

        setBoard(prev => {
          const next = [...prev];
          next.forEach((card, idx) => {
            if (card && card.owner === 'ai') {
              const [u, r, d, l] = card.stats;
              next[idx] = {
                ...card,
                stats: [l, u, r, d] // Rotate clockwise
              };
            }
          });
          return next;
        });
        break;

      case 5: // ÏïΩÌôî Ìï®Ï†ï
        showToast(language === 'ko' ? 'ÏïΩÌôîÌï† ÏúÑÏπòÎ•º ÏÑ†ÌÉùÌïòÏÑ∏Ïöî.' : 'Select a position to weaken.');
        setActiveTrapMode('weaken_trap');
        break;

      case 6: // Í∞ïÌôî Ìï®Ï†ï
        showToast(language === 'ko' ? 'Í∞ïÌôîÌï† ÏúÑÏπòÎ•º ÏÑ†ÌÉùÌïòÏÑ∏Ïöî.' : 'Select a position to reinforce.');
        setActiveTrapMode('reinforce_trap');
        break;

      case 7: // Ï≤¥Ïù∏ÏßÄ ÏÉÅÎåÄÏπ¥Îìú
        showToast(language === 'ko' ? 'Î≥ÄÍ≤ΩÌï† Ï†Å Ïπ¥ÎìúÎ•º ÏÑ†ÌÉùÌïòÏÑ∏Ïöî.' : 'Select an enemy card to change.');
        setActiveTrapMode('change_opponent');
        break;

      case 8: // Ï≤¥Ïù∏ÏßÄ ÎÇ¥Ïπ¥Îìú
        showToast(language === 'ko' ? 'Î≥ÄÍ≤ΩÌï† ÎÇ¥ Ïπ¥ÎìúÎ•º ÏÑ†ÌÉùÌïòÏÑ∏Ïöî.' : 'Select your card to change.');
        setActiveTrapMode('change_player');
        break;
    }
  };

  const [pvpExitCountdown, setPvpExitCountdown] = useState<number | null>(null);

  useEffect(() => {
    // ÏÉÅÎåÄÎ∞© SNSÍ∞Ä 0Ïù¥ ÎêòÏóàÏùÑ Îïå(hasExhausted === true)ÏóêÎßå ÏûêÎèô Ìá¥Ïû• 3Ï¥à Ïπ¥Ïö¥Ìä∏Îã§Ïö¥ Î∞úÎèô
    if (gameOver && battleType === 'pvp_attack' && hasExhausted) {
      setPvpExitCountdown(3);
    } else {
      setPvpExitCountdown(null);
    }
  }, [gameOver, battleType, hasExhausted]);

  useEffect(() => {
    if (pvpExitCountdown === null) return;
    if (pvpExitCountdown <= 0) {
      setPvpExitCountdown(null);
      setCurrentMatchId(null);
      setMatchInfo(null);
      setGameOver(false);
      setWinner(null);
      setCheckingIdx(-1);
      setIsEvaluating(false);
      setGameState('lobby');
      if (setIsAutoBattle) setIsAutoBattle(false);
      onBack();
      return;
    }
    const timer = setTimeout(() => {
      setPvpExitCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [pvpExitCountdown, onBack]);

  // Override auto-battle for tutorial or active auto-battle setting
  const isAutoBattle = (isTutorialMode && tutorialStep > 0 && tutorialStep < 3) || !!propIsAutoBattle;
  const isAutoBattleRef = useRef(isAutoBattle);
  useEffect(() => {
    isAutoBattleRef.current = isAutoBattle;
  }, [isAutoBattle]);

  // Item 346: 3-Speed Mode ('1x' | '2x' | '3x')
  const [autoSpeedMode, setAutoSpeedMode] = useState<'1x' | '2x' | '3x'>(() => {
    return (localStorage.getItem('hero_auto_battle_speed') as '1x' | '2x' | '3x') || '2x';
  });

  const toggleAutoSpeed = () => {
    const nextSpeed: '1x' | '2x' | '3x' = autoSpeedMode === '1x' ? '2x' : autoSpeedMode === '2x' ? '3x' : '1x';
    setAutoSpeedMode(nextSpeed);
    localStorage.setItem('hero_auto_battle_speed', nextSpeed);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const speedMultiplier = isAutoBattle
    ? (autoSpeedMode === '3x' ? 0.15 : autoSpeedMode === '2x' ? 0.5 : 0.9)
    : (isLowPerformance ? 0.5 : 1);

  // Item 347: Loot Goblin Ambush State
  const [goblinTileIndex, setGoblinTileIndex] = useState<number | null>(null);
  const [goblinCaptured, setGoblinCaptured] = useState<boolean>(false);
  const goblinSpawnAttempted = useRef<boolean>(false);

  // Item 348: Speed Attack latency tracking
  const playerTurnStartTime = useRef<number | null>(null);
  const playerTurnLatencies = useRef<number[]>([]);
  const [isSpeedAttackWin, setIsSpeedAttackWin] = useState<boolean>(false);

  // Item 352: Underdog Reversal Bounty
  const [isUnderdogMatch, setIsUnderdogMatch] = useState<boolean>(false);
  const [underdogBountyClaimed, setUnderdogBountyClaimed] = useState<boolean>(false);

  // Item 355: Mana Spring Tile State (30% spawn chance at match start)
  const [manaSpringTileIndex, setManaSpringTileIndex] = useState<number | null>(null);
  const [manaSpringClaimed, setManaSpringClaimed] = useState<boolean>(false);

  // Item 356: Elemental Synergy Combo Trackers
  const [hasTriggeredElementalCombo, setHasTriggeredElementalCombo] = useState<boolean>(false);

  // Item 360: Ironclad Defender (0 cards lost to captures)
  const playerCardsCapturedByAi = useRef<number>(0);
  const [isIroncladWin, setIsIroncladWin] = useState<boolean>(false);

  // Item 367: Poison Swamp Tile & Earth Purify State (35% hazard spawn chance)
  const [poisonSwampTileIndex, setPoisonSwampTileIndex] = useState<number | null>(null);
  const [poisonSwampCleansed, setPoisonSwampCleansed] = useState<boolean>(false);

  // Item 368: Survival Master Clutch Comeback Tracker (tracks lowest friendly card count)
  const minFriendlyCardsCount = useRef<number>(5);

  // Item 372: Shield Crusher Multi-Layer Barrier Tracker
  const bossShieldBreaksCount = useRef<number>(0);
  const [isShieldCrusherWin, setIsShieldCrusherWin] = useState<boolean>(false);

  // Item 376: Mirror Master Zero-Elemental-Advantage Tracker
  const elementBonusCountUsed = useRef<number>(0);

  // Item 375: Turn 7 Rage Spark Ignition Slot
  const [rageSparkSlotIndex, setRageSparkSlotIndex] = useState<number | null>(null);

  // Item 380: 9th Turn 3-Tile Clutch Ace Breaker Comeback Tracker
  const isClutchAceBreaker = useRef<boolean>(false);

  // Item 382: Total Eclipse Full Board Domination (9:0 Win)
  const [isTotalEclipseWin, setIsTotalEclipseWin] = useState<boolean>(false);

  // Item 384: Manual 5-Win Streak Memory Mini-Game Modal
  const manualWinStreak = useRef<number>(0);
  const [isLuckyMatchOpen, setIsLuckyMatchOpen] = useState<boolean>(false);

  // Item 386: 4-Way Cross Simultaneous Capture Flash & Shockwave
  const [isCrossDominationActive, setIsCrossDominationActive] = useState<boolean>(false);

  // Item 387: Post-Boss Manual Victory Treasure Chest Picker Modal
  const [isBossChestUnlockOpen, setIsBossChestUnlockOpen] = useState<boolean>(false);

  // Item 388: Consecutive Capture Fever Mode (2x Currency Drop Multiplier)
  const [feverMeter, setFeverMeter] = useState<number>(0);
  const isFeverMode = feverMeter >= 3;

  // Item 389: Tactician Mastery & Board Auras Modal
  const [isTacticianMasteryOpen, setIsTacticianMasteryOpen] = useState<boolean>(false);

  // Item 390: Micro Screen Shake on 3+ Cascade Flips
  const [isMicroShaking, setIsMicroShaking] = useState<boolean>(false);

  // Item 383 & 385 & 392: Modals
  const [isBeastariumOpen, setIsBeastariumOpen] = useState<boolean>(false);
  const [isExpeditionOpen, setIsExpeditionOpen] = useState<boolean>(false);
  const [isTowerTrialsOpen, setIsTowerTrialsOpen] = useState<boolean>(false);

  // Row 51: Hand Card Long-Press Zoom Preview Modal
  const [longPressPreviewCard, setLongPressPreviewCard] = useState<CardData | null>(null);
  const handLongPressTimerRef = useRef<number | null>(null);

  const handleHandCardPointerDown = (card: CardData) => {
    if (handLongPressTimerRef.current) clearTimeout(handLongPressTimerRef.current);
    handLongPressTimerRef.current = window.setTimeout(() => {
      setLongPressPreviewCard(card);
      triggerHaptic('light');
      handLongPressTimerRef.current = null;
    }, 350);
  };

  const handleHandCardPointerUp = () => {
    if (handLongPressTimerRef.current) {
      clearTimeout(handLongPressTimerRef.current);
      handLongPressTimerRef.current = null;
    }
  };

  // Item 391: Hero Faction/Bond Synergy Passive
  const deckFactionSynergy = useMemo(() => {
    if (!playerDeck || playerDeck.length < 3) return null;
    const counts: Record<string, number> = {};
    playerDeck.forEach(c => {
      const el = getNormalizedElement(c) || 'neutral';
      counts[el] = (counts[el] || 0) + 1;
    });
    const dominant = Object.entries(counts).find(([_, cnt]) => cnt >= 3);
    if (dominant) {
      return { faction: dominant[0], count: dominant[1], buff: '+1 Stats' };
    }
    return null;
  }, [playerDeck]);

  // Item 351: Sudden Death Overclock (turn count / filled slots >= 6)
  const filledBoardCount = board.filter(c => c !== null).length;
  const isSuddenDeathOverclock = gameState === 'playing' && filledBoardCount >= 6;

  // Item 363: 3-Tile Line Mana Circuit calculation (horizontal, vertical, diagonal)
  const activeManaCircuits = useMemo(() => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    const found: { owner: 'player' | 'ai'; line: number[] }[] = [];
    lines.forEach(l => {
      const [a, b, c] = l;
      if (board[a] && board[b] && board[c]) {
        if (board[a]!.owner === board[b]!.owner && board[b]!.owner === board[c]!.owner) {
          found.push({ owner: board[a]!.owner as 'player' | 'ai', line: l });
        }
      }
    });
    return found;
  }, [board]);

  // Battle session initialization & Underdog detection
  useEffect(() => {
    if (gameState === 'playing') {
      goblinSpawnAttempted.current = false;
      setGoblinTileIndex(null);
      setGoblinCaptured(false);
      playerTurnLatencies.current = [];
      setIsSpeedAttackWin(false);
      setUnderdogBountyClaimed(false);
      setManaSpringClaimed(false);
      setHasTriggeredElementalCombo(false);
      playerCardsCapturedByAi.current = 0;
      setIsIroncladWin(false);
      minFriendlyCardsCount.current = 5;
      bossShieldBreaksCount.current = 0;
      setIsShieldCrusherWin(false);
      elementBonusCountUsed.current = 0;
      setRageSparkSlotIndex(null);
      isClutchAceBreaker.current = false;
      setIsTotalEclipseWin(false);
      setIsCrossDominationActive(false);
      setFeverMeter(0);

      // Item 391: Team Faction Synergy Log
      if (deckFactionSynergy) {
        addLog(language === 'ko'
          ? `üõ°Ô∏è [ÏÑ∏Î†• Í≤∞ÏÜç (Faction Synergy)] [${deckFactionSynergy.faction.toUpperCase()}] ÏÑ∏Î†• ÏòÅÏõÖ ${deckFactionSynergy.count}Î™Ö Ìé∏ÏÑ±ÏúºÎ°ú Ï†Ñ ÌåÄÏõê Í≤∞ÏÜç Î≤ÑÌîÑ Î∞úÎèô!`
          : `üõ°Ô∏è [FACTION SYNERGY] ${deckFactionSynergy.count}x [${deckFactionSynergy.faction.toUpperCase()}] heroes activated Team Bond (+1 Stats)!`,
          'system'
        );
      }

      // Item 355: Random Mana Spring spawn (30% chance on random board slot)
      if (Math.random() < 0.30) {
        const springSlot = Math.floor(Math.random() * 9);
        setManaSpringTileIndex(springSlot);
        addLog(language === 'ko'
          ? `üíß [ÎßàÎÇòÏÉò Î∞úÍ≤¨] ${springSlot + 1}Î≤à Íµ¨Ïó≠Ïóê Í≥†ÎåÄ ÎßàÎÇòÏÉòÏù¥ ÏÜüÏïÑÎÇ©ÎãàÎã§! Ï†êÎ†π Ïãú Ïä§ÌÉØ +2 Î∞è +10 SNS Î≥¥ÎÑàÏä§!`
          : `üíß [MANA SPRING] Ancient Mana Spring active on Sector ${springSlot + 1}! Claim for +2 Stats & +10 SNS!`,
          'system'
        );
      } else {
        setManaSpringTileIndex(null);
      }

      // Item 367: Random Poison Swamp hazard spawn (35% chance on random board slot)
      if (Math.random() < 0.35) {
        const hazardSlot = Math.floor(Math.random() * 9);
        setPoisonSwampTileIndex(hazardSlot);
        setPoisonSwampCleansed(false);
        addLog(language === 'ko'
          ? `‚ò£Ô∏è [ÎèÖÍ∏∞ Îä™ÏßÄÎåÄ Î∞úÏÉù] ${hazardSlot + 1}Î≤à Íµ¨Ïó≠Ïóê ÎßπÎèÖ ÏïàÍ∞úÍ∞Ä ÎìúÎ¶¨ÏõÅÎãàÎã§! (ÏßÄÏÜçÏÑ± Ïπ¥ÎìúÎ°ú Ï†ïÌôî Í∞ÄÎä•)`
          : `‚ò£Ô∏è [POISON SWAMP HAZARD] Toxic miasma at Sector ${hazardSlot + 1}! (Cleanse with Earth cards)`,
          'system'
        );
      } else {
        setPoisonSwampTileIndex(null);
        setPoisonSwampCleansed(false);
      }

      const pPower = calculatedTotalPower || 100;
      const aPower = opponentTotalPower || aiSimulatedTotalPower || 100;
      if (pPower < aPower * 0.9) {
        setIsUnderdogMatch(true);
        addLog(language === 'ko' ? '‚ö° [Ïñ∏ÎçîÎèÖ Îß§Ïπò] Ï†ÑÎ†• Ïó¥ÏÑ∏ ÏÉÅÌô©ÏûÖÎãàÎã§! ÏàòÎèô ÏäπÎ¶¨ Ïãú Ïñ∏ÎçîÎèÖ Î≥¥ÎÑàÏä§ +20% ÏßÄÍ∏â!' : '‚ö° [UNDERDOG MATCH] Power deficit detected! Win manually for +20% Underdog Bounty!', 'system');
      } else {
        setIsUnderdogMatch(false);
      }
    }
  }, [gameState]);

  // Item 375: Turn 7 Rage Spark Slot Ignition
  useEffect(() => {
    if (gameState === 'playing' && !gameOver && filledBoardCount === 6 && rageSparkSlotIndex === null) {
      const emptySlots: number[] = [];
      board.forEach((c, idx) => {
        if (c === null) emptySlots.push(idx);
      });
      if (emptySlots.length > 0) {
        const chosen = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        setRageSparkSlotIndex(chosen);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        addLog(language === 'ko'
          ? `üî• [Î∂ÑÎÖ∏ Í∞ÅÏÑ± ÌÉÄÏùº Ï†êÌôî] 7ÌÑ¥ Í∞úÏãú! ${chosen + 1}Î≤à Íµ¨Ïó≠Ïù¥ Î∂ÑÎÖ∏Ïùò Î∂àÍΩÉÏúºÎ°ú Í∞ÅÏÑ±Ìï©ÎãàÎã§! (Î∞∞Ïπò Ïãú Ï†Ñ Î∞©Ìñ• ÌååÏõå +3 Ìè≠Ï£º!)`
          : `üî• [RAGE SPARK IGNITED] Turn 7 reached! Sector ${chosen + 1} ignited with Rage Spark (+3 all-directional power)!`,
          'system'
        );
      }
    }
  }, [gameState, gameOver, filledBoardCount, rageSparkSlotIndex, board, language]);

  // Item 347: Loot Goblin Ambush Check (turns 4~6 / 3~5 filled tiles, 15% spawn chance)
  useEffect(() => {
    if (gameState === 'playing' && !isTutorialMode && !gameOver && goblinTileIndex === null && !goblinSpawnAttempted.current) {
      const filled = board.filter(c => c !== null).length;
      if (filled >= 3 && filled <= 5) {
        goblinSpawnAttempted.current = true;
        if (Math.random() < 0.15) {
          const emptySlots: number[] = [];
          board.forEach((c, idx) => {
            if (c === null) emptySlots.push(idx);
          });
          if (emptySlots.length > 0) {
            const chosenSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
            setGoblinTileIndex(chosenSlot);
            playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            addLog(language === 'ko' 
              ? `ü™ô [Î≥¥Î¨º ÎèÑÎëë Í≥†Î∏îÎ¶∞ ÎÇúÏûÖ] ${chosenSlot + 1}Î≤à Íµ¨Ïó≠Ïóê Í≥†Î∏îÎ¶∞ Ï∂úÌòÑ! 1ÌÑ¥ ÎÇ¥ Ï∫°Ï≤ò Ïãú Î≥¥ÎÑàÏä§ ÌöçÎìù!` 
              : `ü™ô [LOOT GOBLIN AMBUSH] Goblin appeared on Sector ${chosenSlot + 1}! Capture for bonus SNS!`, 
              'system'
            );
          }
        }
      }
    }
  }, [board, gameState, isTutorialMode, gameOver, goblinTileIndex, language]);

  // Item 348: Player turn start time tracking for speed attack bonus
  useEffect(() => {
    if (gameState === 'playing' && turn === 'player' && !gameOver) {
      playerTurnStartTime.current = Date.now();
    }
  }, [turn, gameState, gameOver]);

  const [showInGameRules, setShowInGameRules] = useState(false);


  const [isCoinFlipping, setIsCoinFlipping] = useState(false);
  const [coinWinner, setCoinWinner] = useState<'player' | 'ai' | null>(null);

  const renderCustomAlertModal = () => (
    <AnimatePresence>
      {customAlertModal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="bg-slate-950 text-slate-100 w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.25)] border border-indigo-500/30 relative z-[11001] font-sans"
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-950 to-slate-950 text-white border-b border-indigo-500/20 flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                <ShieldAlert size={20} className="text-indigo-400" />
              </div>
              <h2 className="text-base font-black italic uppercase tracking-tight leading-tight text-slate-100">
                {customAlertModal.title}
              </h2>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm font-bold text-slate-300 leading-relaxed whitespace-pre-line">
                {customAlertModal.message}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex">
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setCustomAlertModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer text-center"
              >
                {language === 'ko' ? 'ÌôïÏù∏' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Example cards for rules visualization
  const rulesExampleCards = useMemo(() => {
    const c1: CardData = {
      id: 'rules-ex1', imageIndex: 1, title: 'ÏòàÏãú Ïπ¥Îìú', title_en: 'Example Card',
      title_dis: 'EXAMPLE', stats: [7, 6, 2, 3],
      level: 1, exp: 0, rarity: 'normal' as const,
    };
    const c2: CardData = {
      id: 'rules-ex2', imageIndex: 2, title: 'ÏÉÅÎåÄ Ïπ¥Îìú', title_en: 'Opponent Card',
      title_dis: 'OPPONENT', stats: [4, 2, 5, 6],
      level: 1, exp: 0, rarity: 'normal' as const,
    };
    return [c1, c2];
  }, []);

  const renderRulesPopup = () => (
    <AnimatePresence>
      {showInGameRules && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-lg w-full overflow-hidden flex flex-col"
          >
            <div className="bg-slate-950 p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-indigo-400">
                <Brain size={28} className="text-indigo-400 animate-pulse" />
                {language === 'ko' ? 'Í≤åÏûÑ Í∑úÏπô' : 'GAME RULES'}
              </h3>
              <button 
                onClick={() => {
                  setShowInGameRules(false);
                  if (tutorialStep === 5) {
                    setTutorialStep?.(6);
                    if (setIsAutoBattle) setIsAutoBattle(true);
                  }
                }} 
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh] bg-slate-900">
              {/* Rule 1: Card Stats */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.3)] text-sm">1</div>
                  <p className="text-sm font-bold leading-relaxed text-slate-200">
                    {language === 'ko' ? 'Í∞Å Ïπ¥ÎìúÎäî ÏÉÅÌïòÏ¢åÏö∞ 4Î∞©Ìñ•Ïùò Ïà´ÏûêÎ•º Í∞ÄÏßëÎãàÎã§.' : 'Each card has 4 directional numbers (Top, Right, Bottom, Left).'}
                  </p>
                </div>
                <div className="flex justify-center pt-2">
                  <div className="relative pointer-events-none">
                    <CardItem
                      card={rulesExampleCards[0]}
                      isLocked={false}
                      className="w-[90px] h-[126px] ring-2 ring-indigo-500/50 rounded-xl shadow-lg"
                    />
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">7</div>
                    <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">6</div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">2</div>
                    <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">3</div>
                  </div>
                </div>
              </div>

              {/* Rule 2: Capture Mechanic with Card Images */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-rose-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center font-black shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.3)] text-sm">2</div>
                  <p className="text-sm font-bold leading-relaxed text-slate-200">
                    {language === 'ko' 
                      ? 'ÎÇ¥ Ïπ¥ÎìúÏùò Ïà´ÏûêÍ∞Ä Ïù∏Ï†ëÌïú ÏÉÅÎåÄ Ïπ¥ÎìúÎ≥¥Îã§ ÌÅ¨Î©¥ Ï∫°Ï≤òÌï©ÎãàÎã§.' 
                      : 'Your higher number captures adjacent enemy cards.'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 md:gap-6 pt-2">
                  {/* Player card */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">YOU</span>
                    <div className="relative pointer-events-none">
                      <CardItem
                        card={rulesExampleCards[0]}
                        isLocked={false}
                        className="w-[80px] h-[112px] ring-2 ring-indigo-500 rounded-lg shadow-lg"
                      />
                      <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold z-10 shadow-md border border-white/20">
                        6
                      </div>
                    </div>
                  </div>
                  {/* VS */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-extrabold text-slate-500">VS</span>
                    <motion.div 
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center"
                    >
                      <Swords size={14} className="text-rose-400" />
                    </motion.div>
                  </div>
                  {/* Opponent card */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">ENEMY</span>
                    <div className="relative pointer-events-none">
                      <CardItem
                        card={rulesExampleCards[1]}
                        isLocked={false}
                        className="w-[80px] h-[112px] ring-2 ring-rose-500 rounded-lg shadow-lg opacity-80"
                      />
                      <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold z-10 shadow-md border border-white/20">
                        2
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mt-2">
                  <p className="text-xs font-bold text-emerald-400 leading-relaxed">
                    {language === 'ko' 
                      ? '‚Üí ÎÇ¥ Ïò§Î•∏Ï™Ω Ïà´Ïûê(6)Í∞Ä ÏÉÅÎåÄ ÏôºÏ™Ω Ïà´Ïûê(2)Î≥¥Îã§ ÌÅ¨ÎØÄÎ°ú ÏÉÅÎåÄ Ïπ¥ÎìúÎ•º Ï∫°Ï≤ò!'
                      : '‚Üí Your Right(6) > Enemy Left(2) ‚Üí Enemy card captured!'}
                  </p>
                </div>
              </div>

              {/* Rule 3: Victory Condition */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-black shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.3)] text-sm">3</div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold leading-relaxed text-slate-200">
                      {language === 'ko' 
                        ? '9Ïπ∏Ïù¥ Î™®Îëê Ï∞®Î©¥ Ï†êÏàòÎ°ú ÏäπÌå® Í≤∞Ï†ï' 
                        : 'When all 9 slots are filled, highest score wins.'}
                    </p>
                    <div className="flex gap-3 text-[11px] font-semibold mt-2">
                      <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                        {language === 'ko' ? '5:4 ÏÑ†Í≥µ=Î¨¥ÏäπÎ∂Ä' : '5:4(1st)=Draw'}
                      </span>
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                        {language === 'ko' ? '5:4 ÌõÑÍ≥µ=ÏäπÎ¶¨' : '5:4(2nd)=Win'}
                      </span>
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                        {language === 'ko' ? '6:3‚Üë Ï¶âÏãúÏäπÎ¶¨' : '6:3+ = Instant Win'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-950 border-t border-slate-800">
              <button 
                onClick={() => {
                  setShowInGameRules(false);
                  if (tutorialStep === 5) {
                    setTutorialStep?.(6);
                    if (setIsAutoBattle) setIsAutoBattle(true);
                  }
                }}
                className="w-full h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 group transition-all shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_35px_rgba(99,102,241,0.4)] active:scale-[0.98]"
              >
                <Check size={20} />
                <span className="text-base font-black italic uppercase tracking-wider">
                  {language === 'ko' ? 'ÌôïÏù∏' : 'GOT IT'}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  const [adaptiveStrategy, setAdaptiveStrategy] = useState<AiStrategy>('balanced');
  const [sessionPatterns, setSessionPatterns] = useState<PlayerPatterns>({
    placements: Array(9).fill(0),
    aggressionScore: 0,
    totalMovesTracked: 0,
    lastTenResults: []
  });
  const [autoBattleStats, setAutoBattleStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [tieBreakerMsg, setTieBreakerMsg] = useState<string | null>(null);
  
  const [aiReasoning, setAiReasoning] = useState<{text: string, cardIdx: number, boardIdx: number, isPlayer?: boolean} | null>(null);
  const [winProbability, setWinProbability] = useState<number>(50);
  const [threatTarget, setThreatTarget] = useState<CardData | null>(null);
  const [operatorPrompt, setOperatorPrompt] = useState<{ question: string, options: { label: string, strategy?: string }[] } | null>(null);
  const [operatorLogs, setOperatorLogs] = useState<string[]>([]);
  const [aiSimulatedTotalPower, setAiSimulatedTotalPower] = useState<number>(0);
  const [capturePreview, setCapturePreview] = useState<number[]>([]);
  const [hoveredCellIdx, setHoveredCellIdx] = useState<number | null>(null);
  const [gameLogs, setGameLogs] = useState<{ id: string, timestamp: number, text: string, type: 'info' | 'capture' | 'system' | 'victory' | 'defeat' }[]>(() => {
    const saved = localStorage.getItem('hero_game_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastCombo, setLastCombo] = useState<{ count: number, timestamp: number } | null>(null);
  const [showDeckPreview, setShowDeckPreview] = useState(false);
  const [showMobileLogs, setShowMobileLogs] = useState(false);
  const [showCortanaHud, setShowCortanaHud] = useState(false);

  // Sync gameLogs to localStorage with Debounce to eliminate main-thread I/O jank
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('hero_game_logs', JSON.stringify(gameLogs));
      } catch (e) {
        // Safe catch
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [gameLogs]);



  useEffect(() => {
    if (setGlobalPopupOpen) {
      setGlobalPopupOpen(showDeckPreview || showRules);
    }
  }, [showDeckPreview, showRules, setGlobalPopupOpen]);

  const addLog = (text: string, type: 'info' | 'capture' | 'system' | 'victory' | 'defeat' = 'info') => {
    setGameLogs(prev => [{ id: Math.random().toString(36).substring(2, 9), timestamp: Date.now(), text, type }, ...prev].slice(0, 30));
  };

  const visibleGameLogs = useMemo(
    () => gameLogs.slice(0, perf.enabled ? perf.listSize : 20),
    [gameLogs, perf.enabled, perf.listSize]
  );

  const boardScore = useMemo(() => {
    let player = 0;
    let ai = 0;
    for (const cell of board) {
      if (cell?.owner === 'player') player += 1;
      if (cell?.owner === 'ai') ai += 1;
    }
    return { player, ai };
  }, [board]);

  useEffect(() => {
    if (onGameStateChange) {
      onGameStateChange(gameState);
    }
  }, [gameState, onGameStateChange]);

  useEffect(() => {
    if (gameState === 'playing' || gameState === 'gameOver' || (!isCoinFlipping && gameState !== 'searching')) {
      setShowDeckPreview(false);
    }
  }, [gameState, isCoinFlipping]);

  useEffect(() => {
    if (gameState === 'playing' && !gameOver) {
      addLog(t('log_battle_init', language), 'system');
    }
  }, [gameState]);
  
  // Lobby Bubbles State (Keep for immersion)
  const [bubbles, setBubbles] = useState<Record<string, {text: string, timestamp: number}>>({});
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 50 });





  // Challenge State removed (Match ID kept for visual state)
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<{player1Id?: string, player2Id?: string, playerPower?: number, opponentPower?: number} | null>(null);
  const [pendingQteMultiplier, setPendingQteMultiplier] = useState<number | null>(null);
  const [qteMatchSummary, setQteMatchSummary] = useState<QteMatchSummary>(INITIAL_QTE_MATCH_SUMMARY);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [lastPlacedIdx, setLastPlacedIdx] = useState<number | null>(null);
  const [hitPulseState, setHitPulseState] = useState<number[]>([]);
  const [combatHighlights, setCombatHighlights] = useState<Record<number, number[]>>({});
  const [floatingStatFX, setFloatingStatFX] = useState<Record<number, { text: string; isPositive: boolean; id: number }>>({});
  const [damagedCells, setDamagedCells] = useState<Record<number, boolean>>({});

  const triggerCellDamage = useCallback((cellIdx: number) => {
    setDamagedCells(prev => ({ ...prev, [cellIdx]: true }));
    setTimeout(() => {
      setDamagedCells(prev => {
        if (!prev[cellIdx]) return prev;
        const next = { ...prev };
        delete next[cellIdx];
        return next;
      });
    }, 650);
  }, []);

  const triggerStatFX = useCallback((cellIdx: number, text: string, isPositive: boolean) => {
    if (!isPositive) {
      triggerCellDamage(cellIdx);
    }
    const fxId = Date.now() + Math.random();
    setFloatingStatFX(prev => ({
      ...prev,
      [cellIdx]: { text, isPositive, id: fxId }
    }));
    setTimeout(() => {
      setFloatingStatFX(prev => {
        if (prev[cellIdx]?.id === fxId) {
          const next = { ...prev };
          delete next[cellIdx];
          return next;
        }
        return prev;
      });
    }, 1600);
  }, [triggerCellDamage]);
  const [checkingIdx, setCheckingIdx] = useState<number>(-1);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showInGameMenu, setShowInGameMenu] = useState(false);
  const [battleHighlights, setBattleHighlights] = useState<Record<number, number[]>>({});
  const isProcessingRef = useRef(false);
  const [isShadowMatch, setIsShadowMatch] = useState(false);
  const [selectedCardSide, setSelectedCardSide] = useState<'player' | 'ai'>('player');
  const [lastOpponent, setLastOpponent] = useState<Character | null>(null);
  const [isDeckPreviewing, setIsDeckPreviewing] = useState(false);
  const [previewCountdown, setPreviewCountdown] = useState(3);
  const [lastAiDeck, setLastAiDeck] = useState<CardData[] | null>(null);
  const hasRecordedResult = useRef(false);

  // Turn Countdown Timer (Row 26)
  useEffect(() => {
    if (gameState !== 'playing' || gameOver || isEvaluating) {
      setTurnTimerSeconds(15);
      return;
    }

    setTurnTimerSeconds(15);

    const timer = setInterval(() => {
      setTurnTimerSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        const next = prev - 1;
        if (next <= 5 && next > 0 && turn === 'player' && !isAutoBattle) {
          try {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          } catch {}
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [turn, gameState, gameOver, isEvaluating, isAutoBattle, playSfx]);

  const resetQteState = useCallback(() => {
    setPendingQteMultiplier(null);
    setQteMatchSummary(INITIAL_QTE_MATCH_SUMMARY);
  }, []);

  const getOriginalBaseReward = useCallback((result: 'win' | 'loss' | 'draw') => {
    const actualResult = result === 'loss' ? 'win' : result;
    let base = actualResult === 'win' ? 50 : 20;
    
    if (battleType === 'pvp_attack') {
      base = actualResult === 'win' ? 500 : 200;
    } else {
      if (battleType === 'robot') {
        const diffMultiplier = aiDifficulty === 'hard' ? 1.5 : (aiDifficulty === 'medium' ? 1.2 : 1.0);
        base = Math.ceil(base * diffMultiplier);
      }
      
      const playerDeckPower = playerDeck.reduce((acc, c) => acc + (c.power || 0), 0) || 10;
      const effOpponentPower = lastOpponent?.type === 'user' 
        ? ((lastOpponent as any).deck?.reduce((acc: number, c: any) => acc + (c.power || 0), 0) || aiSimulatedTotalPower) 
        : aiSimulatedTotalPower;
        
      if (actualResult === 'win') {
        if (effOpponentPower > playerDeckPower) {
          const diff = effOpponentPower - playerDeckPower;
          const bonus = Math.floor(diff / 10);
          base += bonus;
        }
      }
    }
    return base;
  }, [battleType, aiDifficulty, playerDeck, lastOpponent, aiSimulatedTotalPower]);

  const calculateReward = useCallback((result: 'win' | 'loss' | 'draw') => {
    const orig = getOriginalBaseReward(result);
    if (result === 'loss') {
      if (battleType === 'robot') {
        // AIÎåÄÏ†ÑÏóêÏÑúÎäî Ìå®Î∞∞ÌïòÎçîÎùºÎèÑ ÏÜåÎüâÏùò SNS(5)Î•º ÏßÄÍ∏â
        return 5;
      }
      return -orig;
    }
    
    if (isAutoBattle) {
      return Math.max(1, Math.ceil(orig * 0.2));
    }
    return orig;
  }, [battleType, isAutoBattle, getOriginalBaseReward]);

  // Lobby State
  const [chars, setChars] = useState<Character[]>([]);
  const lobbyRef = useRef<HTMLDivElement>(null);
  // onlineUsers removed
  const [lobbyPage, setLobbyPage] = useState(0);
  const USERS_PER_PAGE = 5;

  useEffect(() => {
    setOpponentStrategy(botAiStrategy);
  }, [botAiStrategy]);

  // Auto-battle Search Trigger
  useEffect(() => {
    if (gameState === 'lobby' && isAutoBattle && (!isTutorialMode || tutorialStep < 1 || tutorialStep > 5)) {
      // Find nearest robot to battle automatically
      const bot = chars.find(c => c.type === 'robot');
      if (bot) {
        // Walk to the bot
        setPlayerPos({ x: bot.x, y: bot.y });
        
        const timer = setTimeout(() => {
          handleEncounter(bot);
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setGameState('searching');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, isAutoBattle, chars, isTutorialMode]);

  // Robot encounters only in standalone
  useEffect(() => {
    if (gameState === 'lobby' && initialChallengeTarget) {
      const targetUser = chars.find(u => u.id === initialChallengeTarget);
      if (targetUser) {
        handleEncounter(targetUser);
        onChallengeHandled?.();
      }
    }
  }, [gameState, initialChallengeTarget, chars, onChallengeHandled]);

  // Handle PVP Attack from Ranking View / RPG View
  useEffect(() => {
    if (!pvpOpponent) return;

    if (effectiveUser?.uid && pvpOpponent.id === effectiveUser.uid) {
      triggerAlert(
        language === 'ko' ? 'ÏûêÍ∏∞ ÏûêÏã†Í≥ºÎäî ÎåÄÏ†ÑÌï† Ïàò ÏóÜÏäµÎãàÎã§.' : 'You cannot battle yourself.',
        language === 'ko' ? 'ÏïåÎ¶º' : 'NOTICE'
      );
      onClearPvpOpponent?.();
      setGameState('lobby');
      return;
    }

    const oppChar: Character = {
      id: `ranking-${pvpOpponent.id}`,
      type: 'user',
      name: pvpOpponent.name,
      deck: pvpOpponent.deck,
      x: 50,
      y: 50,
      targetX: 50,
      targetY: 50,
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${pvpOpponent.name}&backgroundColor=badeff`,
      totalPower: pvpOpponent.totalPower,
      sns: pvpOpponent.sns,
      wins: pvpOpponent.wins,
      losses: pvpOpponent.losses,
      draws: pvpOpponent.draws
    };

    setSelectedOpponent(oppChar);
    startRobotMatch(oppChar);
    onClearPvpOpponent?.();
  }, [pvpOpponent, effectiveUser?.uid, onClearPvpOpponent]);


  // Presense update removed (standalone mode)
  useEffect(() => {
    if (gameState !== 'lobby' || !effectiveUser) return;
    setPlayerPos({ x: 50, y: 50 });
  }, [gameState]);

  // Macro Tutorial Effect (3~6 steps)
  useEffect(() => {
    if (!tutorialStep) return;

    // Step 3 Entry: Auto-select AI Battle mode
    if (tutorialStep === 3 && gameState === 'modeSelect') {
      setGameState('lobby');
    }

    // Step 3 Action: Select first bot
    if (tutorialStep === 3 && gameState === 'lobby') {
      const firstBot = chars.find(c => c.type === 'robot');
      if (firstBot) {
        handleEncounter(firstBot);
      }
    }

    // Step 3 Confirmation: Move to Step 4 ONLY when preMatch is ready
    if (tutorialStep === 3 && gameState === 'preMatch' && selectedOpponent) {
      setTutorialStep?.(4);
    }

    // Step 4 Action: Start Battle
    if (tutorialStep === 4 && gameState === 'preMatch' && selectedOpponent) {
       const timer = setTimeout(() => {
         if (tutorialStep === 4 && gameState === 'preMatch') {
           startRobotMatch(selectedOpponent);
         }
       }, 1500);
       return () => clearTimeout(timer);
    }

    // Step 4 Confirmation: Move to Step 5 ONLY when playing starts
    if (tutorialStep === 4 && gameState === 'playing') {
      setTutorialStep?.(5);
    }

    // Step 5: Rules (Controlled by showInGameRules logic inside PlayGameView)
    if (tutorialStep === 5 && gameState === 'playing' && !showInGameRules) {
      setShowInGameRules(true);
    }
  }, [tutorialStep, gameState, selectedOpponent, chars]);

  // When match ends, move to step 7
  useEffect(() => {
    if (tutorialStep === 6 && gameOver) {
      setTutorialStep?.(7);
    }
  }, [tutorialStep, gameState, selectedOpponent, gameOver]);

  // Initialize Lobby Robots (Scattered & Unique)
  useEffect(() => {
    if ((gameState === 'lobby' || gameState === 'searching' || gameState === 'dungeon') && chars.length === 0) {
      const robots: Character[] = Array(5).fill(null).map((_, i) => {
        // Disperse robots to avoid central overlap with player
        const sector = i % 4; // 0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right
        const baseX = sector === 1 || sector === 3 ? 60 : 15;
        const baseY = sector >= 2 ? 60 : 15;

        // Generate realistic totalPower around player's power with variance
        const playerPower = calculatedTotalPower || 1000;
        const powerVariance = 0.7 + Math.random() * 0.6; // 70% ~ 130% of player power
        const botTotalPower = Math.max(100, Math.floor(playerPower * powerVariance));

        // Generate SNS that correlates with power (some randomness)
        const snsBase = botTotalPower * (0.5 + Math.random() * 1.5);
        const botSns = Math.max(0, Math.floor(snsBase));

        return {
          id: `bot-${i}`,
          type: 'robot',
          x: baseX + Math.random() * 25,
          y: baseY + Math.random() * 25,
          targetX: Math.random() * 70 + 15,
          targetY: Math.random() * 70 + 15,
          name: generateAiName(`bot-${i}-${Date.now()}`),
          avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Robot-${i}&backgroundColor=dc2626`,
          totalPower: botTotalPower,
          sns: botSns,
          wins: Math.floor(Math.random() * 50),
          losses: Math.floor(Math.random() * 30),
          draws: Math.floor(Math.random() * 10)
        };
      });
      setChars(robots);
    }
  }, [gameState, calculatedTotalPower]);

  // Automated searching logic to transition out of ENCU_PROTOCOL
  useEffect(() => {
    // Old tutorial step 2 logic removed to avoid conflict with new macro
  }, [tutorialStep, gameState, chars]);

  useEffect(() => {
    if (gameState === 'searching' && !isCoinFlipping) {
      const playerPower = calculatedTotalPower || 1000;
      if (isAutoBattle && battleType === 'robot') {
        const powerVariance = 0.7 + Math.random() * 0.6;
        const botTotalPower = Math.max(100, Math.floor(playerPower * powerVariance));
        const snsBase = botTotalPower * (0.5 + Math.random() * 1.5);
        const botSns = Math.max(0, Math.floor(snsBase));
        const freshBot: Character = {
          id: `bot-${Date.now()}`,
          type: 'robot',
          x: 50, y: 50,
          targetX: 50, targetY: 50,
          name: generateAiName(`bot-${Date.now()}`),
          avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Robot-${Date.now()}&backgroundColor=dc2626`,
          totalPower: botTotalPower,
          sns: botSns,
          wins: Math.floor(Math.random() * 50),
          losses: Math.floor(Math.random() * 30),
          draws: Math.floor(Math.random() * 10)
        };
        const timer = setTimeout(() => {
          startRobotMatch(freshBot);
        }, 2500 * speedMultiplier);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(() => {
        const robots = chars.filter(c => c.type === 'robot');
        const bestMatch = findBestMatchingRobot(robots, playerPower, sns || 0);

        if (bestMatch) {
          startRobotMatch(bestMatch);
        } else if (chars.length > 0) {
          startRobotMatch(chars[0]);
        } else {
          setGameState('lobby');
        }
      }, 2500 * speedMultiplier);
      return () => clearTimeout(timer);
    }
  }, [gameState, isCoinFlipping, chars, speedMultiplier, calculatedTotalPower, sns, isAutoBattle, battleType]);

  // AI Tactical Analyzer Operator Logic
  useEffect(() => {
    if (gameState !== 'playing' || gameOver) {
      setThreatTarget(null);
      setOperatorPrompt(null);
      return;
    }

    const pScore = board.filter(c => c?.owner === 'player').length;
    const aScore = board.filter(c => c?.owner === 'ai').length;
    const emptyCells = board.filter(c => c === null).length;
    
    const pPower = calculatedTotalPower || 50;
    const aPower = opponentTotalPower || aiSimulatedTotalPower || 50;
    
    let baseProb = 50;
    baseProb += (pScore - aScore) * 8;
    
    const powerRatio = pPower / (pPower + aPower);
    baseProb += (powerRatio - 0.5) * 40;
    
    const jitter = (Math.random() - 0.5) * 5;
    let finalProb = Math.min(98.5, Math.max(1.5, baseProb + jitter));
    setWinProbability(parseFloat(finalProb.toFixed(1)));

    let worstThreat: CardData | null = null;
    const scanCards = [
      ...opponentHand,
      ...board.filter(c => c !== null && c.owner === 'ai')
    ];
    scanCards.forEach(c => {
      if (!c) return;
      if (!worstThreat) {
        worstThreat = c;
      } else {
        const cThreatVal = (c.power || 0) + (c.ability ? 15 : 0);
        const wThreatVal = (worstThreat.power || 0) + (worstThreat.ability ? 15 : 0);
        if (cThreatVal > wThreatVal) worstThreat = c;
      }
    });
    setThreatTarget(worstThreat);

    const pName = getFormattedCardName(worstThreat, language);
    let analysisMsg = "";
    if (emptyCells === 9) {
      analysisMsg = language === 'ko' ? "Îß§Ìä∏Î¶≠Ïä§ Ïä§Ï∫êÎãù ÏôÑÎ£å. Ï†ÑÏà† Î≤ÑÌçº Î°úÎî© Ï§ë..." : "Matrix scanning complete. Tactical buffer loading...";
    } else if (worstThreat) {
      if (finalProb < 45) {
        analysisMsg = language === 'ko' 
          ? `Í≤ΩÍ≥†: ÌåêÏÑ∏ Ïó¥ÏÑ∏ Í∞êÏßÄ. Ï†ÅÏùò ${pName} ÏúÑÌòë Î†àÎ≤® ÏÉÅÏäπ. Ïö∞Ìöå Ï†ÑÏà† ÏÑúÏπò Ï§ë.`
          : `Warning: Tactical deficit. Enemy ${pName} threat level high. Searching bypass paths.`;
      } else if (finalProb > 70) {
        analysisMsg = language === 'ko'
          ? `Î∂ÑÏÑù ÏôÑÎ£å: ÏïÑÍµ∞ Ìè¨ÏßÄÏÖîÎãù Ï†êÏú†Ïú® 70% ÎèåÌåå. ÏïàÏ†ïÏ†Å ÏΩ§Î≥¥ Î∞©Î≤Ω Ïú†ÏßÄ Í∂åÏû•.`
          : `Analysis: Allied positioning exceeds 70%. Recommended to maintain stable combo walls.`;
      } else {
        analysisMsg = language === 'ko'
          ? `Í∞êÏßÄ: ÏÉÅÎåÄ ${pName} Ïπ¥ÎìúÏùò ÌóàÏ†ê Ïä§Ï∫î Ï§ë. Î∞∞Ïπò ÏΩ§Î≥¥ ÏãúÎÆ¨Î†àÏù¥ÏÖò Í∞ÄÎèô.`
          : `Detected: Scanning weak points of enemy ${pName}. Deploying combo simulation.`;
      }
    } else {
      analysisMsg = language === 'ko' ? "Ïã§ÏãúÍ∞Ñ Ïó∞ÏÇ∞ Ïª§ÎÑê ÏûëÎèô Ï§ë. ÏµúÏ†ÅÏùò Í≤ΩÎ°úÎ•º ÌÉêÏÉâÌïòÍ≥† ÏûàÏäµÎãàÎã§." : "Real-time kernel active. Searching for optimal placement paths.";
    }

    setOperatorLogs(prev => {
      const next = [analysisMsg, ...prev].slice(0, 15);
      return Array.from(new Set(next));
    });

    if ([7, 5, 3].includes(emptyCells) && !operatorPrompt) {
      const isKo = language === 'ko';
      setOperatorPrompt({
        question: isKo 
          ? `[ÎèåÎ∞ú ÏßàÎ¨∏] ÎßàÏä§ÌÑ∞, ÏäπÎ•† ÌôïÎ≥¥Î•º ÏúÑÌï¥ AI Ï†ÑÏà† Î™®ÎìúÎ•º Ïñ¥ÎñªÍ≤å Ï†ÑÌôòÌï†ÍπåÏöî?` 
          : `[Tactic Shift] Master, how shall we shift our tactical operator mode?`,
        options: [
          { 
            label: isKo ? 'Í≥µÍ≤©Ìòï (Í≥µÍ≤©Î†• ÏûÑÏãú Î≤ÑÌîÑ +2)' : 'Aggressive (+2 CP Virtual Buff)', 
            strategy: 'aggressive' 
          },
          { 
            label: isKo ? 'Î∞©Ïñ¥Ìòï (Í∞ÄÏû•ÏûêÎ¶¨ Ï∞®Îã® Ï†ÑÏà†)' : 'Defensive (Edge block)', 
            strategy: 'defensive' 
          },
          { 
            label: isKo ? 'Î∞∏Îü∞Ïä§ (ÏµúÏ†Å ÏãúÎÆ¨Î†àÏù¥ÏÖò Ïú†ÏßÄ)' : 'Balanced (Maintain optimal)', 
            strategy: 'balanced' 
          }
        ]
      });
    }
  }, [board, turn, gameState]);

  const handleSelectOperatorTactic = (strategy: string) => {
    if (onAiStrategyChange) {
      onAiStrategyChange(strategy as AiStrategy);
    }
    setAdaptiveStrategy(strategy as AiStrategy);
    setOperatorPrompt(null);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    
    const isKo = language === 'ko';
    let msg = "";
    if (strategy === 'aggressive') {
      msg = isKo ? "Ïò§ÌçºÎ†àÏù¥ÌÑ∞: Ï†ÑÏà† Î™®ÎìúÍ∞Ä Í≥µÍ≤©ÌòïÏúºÎ°ú Í∞úÌé∏ÎêòÏóàÏäµÎãàÎã§. Î≤ÑÌîÑ Ï†ÅÏö© ÏôÑÎ£å." : "Operator: Shifted to Aggressive. Virtual buff applied.";
    } else if (strategy === 'defensive') {
      msg = isKo ? "Ïò§ÌçºÎ†àÏù¥ÌÑ∞: Ï†ÑÏà† Î™®ÎìúÍ∞Ä Î∞©Ïñ¥ÌòïÏúºÎ°ú Í∞úÌé∏ÎêòÏóàÏäµÎãàÎã§." : "Operator: Shifted to Defensive.";
    } else {
      msg = isKo ? "Ïò§ÌçºÎ†àÏù¥ÌÑ∞: Ï†ÑÏà† Î™®ÎìúÍ∞Ä Î∞∏Îü∞Ïä§ÌòïÏúºÎ°ú Í∞úÌé∏ÎêòÏóàÏäµÎãàÎã§." : "Operator: Shifted to Balanced.";
    }
    
    setOperatorLogs(prev => [msg, ...prev]);
  };

  const handleLobbyClick = (e: React.MouseEvent) => {
    if (gameState !== 'lobby' || !lobbyRef.current) return;
    const rect = lobbyRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlayerPos({ x, y });
  };

  const allChars = (() => {
    const seen = new Set();
    const result: Character[] = [];
    
    // 1. Robots (NPCs) are always visible
    chars.forEach(c => {
      seen.add(c.id);
      result.push(c);
    });

    const otherUsers: Character[] = [];
    const activeOnes = otherUsers.filter(u => u.status === 'online');
    const offlineOnes = otherUsers.filter(u => u.status !== 'online');

    // 2. Active (Online) users are always visible on every page
    activeOnes.forEach(c => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        result.push(c);
      }
    });

    // 3. Paginate Offline/Dummy users
    const startIndex = lobbyPage * USERS_PER_PAGE;
    const paginatedOffline = offlineOnes.slice(startIndex, startIndex + USERS_PER_PAGE);

    paginatedOffline.forEach(c => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        result.push(c);
      }
    });

    return result;
  })();

  const [animatedPositions, setAnimatedPositions] = useState<Record<string, { x: number, y: number }>>({});

  useEffect(() => {
    if (gameState !== 'lobby' && gameState !== 'dungeon') return;
    
    setAnimatedPositions(prev => {
      const next = { ...prev };
      allChars.forEach(c => {
         if (!next[c.id]) next[c.id] = { x: c.x, y: c.y };
      });
      return next;
    });
    
    const interval = setInterval(() => {
       setAnimatedPositions(prev => {
         const next = { ...prev };
         allChars.forEach(c => {
           // Move independently, ~33% chance to move every 2 seconds
           if (next[c.id] && Math.random() < 0.33) {
             next[c.id] = {
               x: Math.max(15, Math.min(85, next[c.id].x + (Math.random() * 40 - 20))),
               y: Math.max(15, Math.min(85, next[c.id].y + (Math.random() * 40 - 20)))
             };
           }
         });
         return next;
       });
    }, 2000);
    return () => clearInterval(interval);
  }, [gameState, allChars.map(c => c.id).join(',')]);

  const totalOfflineCount = 0;
  const totalPages = Math.max(1, Math.ceil(totalOfflineCount / USERS_PER_PAGE));

  // Auto-battle: Lobby Automation
  useEffect(() => {
    if (!isAutoBattle || gameState !== 'lobby' || (isTutorialMode && tutorialStep >= 1 && tutorialStep <= 5)) return;

    const autoPick = () => {
      const robots = allChars.filter(c => c.type === 'robot');
      const selected = findBestMatchingRobot(robots, calculatedTotalPower || 1000, sns || 0);
      if (selected) {
        handleEncounter(selected);
      }
    };

    const timer = setTimeout(autoPick, 2000 * speedMultiplier);
    return () => clearTimeout(timer);
  }, [isAutoBattle, gameState, allChars, calculatedTotalPower, sns, isTutorialMode]);

  // Auto-battle: Dungeon Automation
  useEffect(() => {
    if (!isAutoBattle || gameState !== 'dungeon') return;

    const autoPickDungeon = () => {
      const robots = allChars.filter(c => c.type === 'robot');
      const selected = findBestMatchingRobot(robots, calculatedTotalPower || 1000, sns || 0);
      if (selected) {
        handleDungeonEncounter(selected);
      }
    };

    const timer = setTimeout(autoPickDungeon, 2000 * speedMultiplier);
    return () => clearTimeout(timer);
  }, [isAutoBattle, gameState, allChars, calculatedTotalPower, sns]);

  // Dungeon Auto Battle result modal auto close
  useEffect(() => {
    if (!showDungeonBattleResultModal || !isAutoBattle) return;

    const timer = setTimeout(() => {
      closeDungeonBattleResult();
    }, 3000);

    return () => clearTimeout(timer);
  }, [showDungeonBattleResultModal, isAutoBattle]);

  useEffect(() => {
    if (isAutoBattle && battleType !== 'pvp_attack' && gameOver && (!isTutorialMode || (tutorialStep !== 6 && tutorialStep !== 7)) && !isBossActive && !isStoryActive && !isDungeonActive && !isTournamentActive) {
      const isMatgo = battleType === 'matgo';
      const timer = setTimeout(() => {
        if (isMatgo) {
          handleRematch();
        } else {
          setGameState('searching');
          setBoard(Array(9).fill(null));
          setPlayerHand([]);
          setOpponentHand([]);
          setGameOver(false);
          setWinner(null);
          setCheckingIdx(-1);
          setIsEvaluating(false);
          hasRecordedResult.current = false;
          setShowOverwhelmingEffect(false);
          setShowStreakEffect(false);
          setCurrentWinStreakDisplay(0);
          setCurrentMatchId(null);
          setMatchInfo(null);
          setSelectedOpponent(null);
          setBattleType('robot');
          setLastOpponent(null);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAutoBattle, gameOver, isBossActive, isStoryActive, isDungeonActive, isTournamentActive, isTutorialMode, battleType, tutorialStep]);

  // removed duplicate auto-battle player turn effect

  // Ï†ÑÌà¨ Ìå®Î∞∞ (winner === 'ai') 5Ï¥à Ïπ¥Ïö¥Ìä∏Îã§Ïö¥ ÌõÑ ÏûêÎèô Îã´Ìûò (Î°úÎπÑÎ°ú Ìá¥Ïû•)
  useEffect(() => {
    if (gameOver) {
      if (winner === 'ai') {
        setDefeatExitCountdown(5);
        setRematchCountdown(null);
      } else if (isBossActive || isStoryActive || isDungeonActive || isTournamentActive) {
        setDefeatExitCountdown(null);
        setRematchCountdown(null);
      } else if (battleType === 'pvp_attack' && hasExhausted) {
        setDefeatExitCountdown(null);
        setRematchCountdown(null);
        setShowInsufficientPopup(true);
      } else if (isAutoBattle && battleType !== 'pvp_attack') {
        setDefeatExitCountdown(null);
        setRematchCountdown(null);
      } else {
        setDefeatExitCountdown(null);
        setRematchCountdown(3);
      }
    } else {
      setDefeatExitCountdown(null);
      setRematchCountdown(null);
    }
  }, [gameOver, winner, hasExhausted, battleType, isBossActive, isStoryActive, isDungeonActive, isTournamentActive, isAutoBattle]);

  // Ìå®Î∞∞ ÌåùÏóÖ 5Ï¥à ÏûêÎèô Îã´Ìûò ÌÉÄÏù¥Î®∏
  useEffect(() => {
    if (defeatExitCountdown === null) return;
    if (defeatExitCountdown <= 0) {
      setDefeatExitCountdown(null);
      handleExitMatch(false);
      setShowBattleShareTemplate(false);
      setShowOverwhelmingEffect(false);
      setShowStreakEffect(false);
      setCurrentWinStreakDisplay(0);
      return;
    }

    const timer = setTimeout(() => {
      setDefeatExitCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [defeatExitCountdown]);

  // ÎçòÏ†Ñ Ï†ÑÌà¨ Ìå®Î∞∞ 5Ï¥à ÏûêÎèô Îã´Ìûò ÌÉÄÏù¥Î®∏
  useEffect(() => {
    if (dungeonBattleWinner === 'ai') {
      setDungeonDefeatCountdown(5);
    } else {
      setDungeonDefeatCountdown(null);
    }
  }, [dungeonBattleWinner]);

  useEffect(() => {
    if (dungeonDefeatCountdown === null) return;
    if (dungeonDefeatCountdown <= 0) {
      setDungeonDefeatCountdown(null);
      closeDungeonBattleResult();
      return;
    }

    const timer = setTimeout(() => {
      setDungeonDefeatCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [dungeonDefeatCountdown]);

  useEffect(() => {
    if (rematchCountdown === null) return;
    if (rematchCountdown <= 0) {
      handleRematch();
      return;
    }

    const timer = setTimeout(() => {
      setRematchCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [rematchCountdown]);

  // Standalone mode: no remote matches

  // Lobby Bubble taunt logic (IMMERSION ONLY, NOT CHAT)
  useEffect(() => {
    if (gameState !== 'lobby' && gameState !== 'dungeon') return;
    const tauntKeys: (keyof typeof staticTranslations.ko)[] = ["taunt_1", "taunt_2", "taunt_3", "taunt_4", "taunt_5", "taunt_6", "taunt_7", "taunt_8", "taunt_9"];
    const interval = setInterval(() => {
       const robots = chars.filter(c => c.type === 'robot');
       if (robots.length > 0) {
           const bot = robots[Math.floor(Math.random() * robots.length)];
           const text = t(tauntKeys[Math.floor(Math.random() * tauntKeys.length)] as any, language);
           setBubbles(prev => ({ ...prev, [bot.id]: { text, timestamp: Date.now() } }));
       }
    }, 5000); 
    return () => clearInterval(interval);
  }, [gameState, chars, language]);

  // Clean up expired bubbles
  useEffect(() => {
    if (gameState !== 'lobby' && gameState !== 'dungeon') return;
    const interval = setInterval(() => {
       const now = Date.now();
       setBubbles(prev => {
          let changed = false;
          const next = { ...prev };
          for (const k in next) {
            if (now - next[k].timestamp > 4000) {
              delete next[k];
              changed = true;
            }
          }
          return changed ? next : prev;
       });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Wandering Logic (Optimized for scattering & GPS mode)
  useEffect(() => {
    if (gameState !== 'lobby' && gameState !== 'dungeon') return;

    const interval = setInterval(() => {
      setChars(prev => prev.map(c => {
        if (isGpsActive && c.lat && c.lng) {
          // Micro wandering on map coordinates
          const randAngle = (parseInt(c.id.split('-')[1]) * 45) + (Date.now() / 1000) * 0.2;
          const speed = 0.0000002;
          const dLat = Math.sin(randAngle) * speed;
          const dLng = Math.cos(randAngle) * speed;
          return {
            ...c,
            lat: c.lat + dLat,
            lng: c.lng + dLng
          };
        }

        const dx_total = c.targetX - c.x;
        const dy_total = c.targetY - c.y;
        const dist = Math.sqrt(dx_total * dx_total + dy_total * dy_total);
        
        if (dist < 0.5) {
          return {
            ...c,
            targetX: Math.random() * 70 + 15,
            targetY: Math.random() * 70 + 15
          };
        }
        
        // Slow constant speed
        const speed = 0.08 + (parseInt(c.id.split('-')[1]) % 5) * 0.02;
        const dx = (dx_total / dist) * speed;
        const dy = (dy_total / dist) * speed;
        
        return {
          ...c,
          x: c.x + dx,
          y: c.y + dy
        };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, isGpsActive]);

  // Leaflet Map Initialization & Synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !isGpsActive || !gpsCoords || (gameState !== 'lobby' && gameState !== 'dungeon')) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userMarkerRef.current = null;
        botMarkersRef.current = {};
      }
      return;
    }

    if (!mapContainerRef.current) return;

    const mapCenter: [number, number] = [gpsCoords.lat, gpsCoords.lng];

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: mapCenter,
        zoom: 18,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      mapRef.current = map;
    } else {
      mapRef.current.setView(mapCenter);
    }

    // Update or create player marker
    if (!userMarkerRef.current) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div class="relative w-12 h-12 flex items-center justify-center p-1 bg-blue-600 border-2 border-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.7)] animate-pulse">
                 <img src="${effectiveUser?.photoURL?.startsWith('preset:') 
                   ? `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero-${effectiveUser.photoURL.split(':')[1]}` 
                   : (effectiveUser?.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=Hero&backgroundColor=3b82f6`)}" 
                   class="w-full h-full object-cover rounded-lg" />
                 <div class="absolute -bottom-5 bg-blue-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-white/20 whitespace-nowrap shadow">YOU</div>
               </div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      userMarkerRef.current = L.marker(mapCenter, { icon: userIcon }).addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLatLng(mapCenter);
    }

    // Place robots randomly around player (within 50m~150m) if not placed
    setChars(prev => {
      let changed = false;
      const next = prev.map(c => {
        if (c.type === 'robot' && (!c.lat || !c.lng)) {
          changed = true;
          const dLat = (Math.random() - 0.5) * 0.0018;
          const dLng = (Math.random() - 0.5) * (0.0018 / Math.cos(gpsCoords.lat * Math.PI / 180));
          return {
            ...c,
            lat: gpsCoords.lat + dLat,
            lng: gpsCoords.lng + dLng
          };
        }
        return c;
      });
      return changed ? next : prev;
    });

    // Update AI robot markers on map
    const activeBotIds = new Set<string>();
    chars.forEach(c => {
      if (c.type === 'robot' && c.lat && c.lng) {
        activeBotIds.add(c.id);
        const botLatLng: [number, number] = [c.lat, c.lng];

        if (!botMarkersRef.current[c.id]) {
          const botIcon = L.divIcon({
            className: 'custom-bot-marker',
            html: `<div class="relative w-10 h-10 flex items-center justify-center p-1 bg-red-600 border-2 border-white rounded-xl shadow-[0_0_12px_rgba(220,38,38,0.8)] cursor-pointer">
                     <div class="absolute -top-3 bg-red-600 text-white text-[8px] font-black px-1 py-0.2 rounded border border-white shadow">AI</div>
                     <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${c.id}&backgroundColor=b6e3f4" 
                       class="w-full h-full object-cover rounded-lg" />
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          const marker = L.marker(botLatLng, { icon: botIcon }).addTo(mapRef.current!);
          botMarkersRef.current[c.id] = marker;
        } else {
          botMarkersRef.current[c.id].setLatLng(botLatLng);
        }

        const marker = botMarkersRef.current[c.id];
        marker.off('click');
        marker.on('click', () => {
          if (gameState === 'dungeon') {
            handleDungeonEncounter(c);
          } else {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            handleEncounter(c);
          }
        });
      }
    });

    // Remove stale robot markers
    Object.keys(botMarkersRef.current).forEach(id => {
      if (!activeBotIds.has(id)) {
        botMarkersRef.current[id].remove();
        delete botMarkersRef.current[id];
      }
    });
  }, [isGpsActive, gpsCoords, chars, gameState]);

  // GPS Movement accumulator & battle trigger (10 meters)
  useEffect(() => {
    if (!isGpsActive || !gpsCoords || (gameState !== 'lobby' && gameState !== 'dungeon')) {
      prevGpsCoordsRef.current = null;
      return;
    }

    if (prevGpsCoordsRef.current) {
      const distDelta = getDistance(
        prevGpsCoordsRef.current.lat,
        prevGpsCoordsRef.current.lng,
        gpsCoords.lat,
        gpsCoords.lng
      );

      if (distDelta > 0.5) { // filter noise
        setWorkoutDistance(prev => {
          const next = prev + distDelta;
          if (next >= 10) {
            const bots = chars.filter(c => c.type === 'robot' && c.lat && c.lng);
            if (bots.length > 0) {
              let closest = bots[0];
              let minDist = Infinity;
              bots.forEach(b => {
                const d = getDistance(gpsCoords.lat, gpsCoords.lng, b.lat!, b.lng!);
                if (d < minDist) {
                  minDist = d;
                  closest = b;
                }
              });

              setTimeout(() => {
                if (gameState === 'dungeon') {
                  handleDungeonEncounter(closest);
                } else {
                  handleEncounter(closest);
                }
              }, 500);
            }
            return 0; // reset
          }
          return next;
        });

        setWorkoutCalories(prev => prev + distDelta * 0.06);
      }
    }

    prevGpsCoordsRef.current = gpsCoords;
  }, [gpsCoords, isGpsActive, chars, gameState]);

  const animatePlayerTo = (targetLat: number, targetLng: number, onComplete: () => void) => {
    if (!userMarkerRef.current || !gpsCoords) {
      onComplete();
      return;
    }
    const startLat = gpsCoords.lat;
    const startLng = gpsCoords.lng;
    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: easeInOutQuad
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      const currentLat = startLat + (targetLat - startLat) * ease;
      const currentLng = startLng + (targetLng - startLng) * ease;

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([currentLat, currentLng]);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(onComplete, 100);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleDungeonEncounter = (char: Character) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    
    const startBattleAction = () => {
      setIsDungeonActive(true);
      saveDungeonState(true);
      initDungeonMonsters();
      const allCardIds = Object.keys(CARD_DATABASE).map(Number).filter(id => id < 100);
      const randomCardId = allCardIds[Math.floor(Math.random() * allCardIds.length)] || 1;
      startDungeonBattle(false, randomCardId);
    };

    if (isGpsActive && gpsCoords && char.lat && char.lng) {
      animatePlayerTo(char.lat, char.lng, startBattleAction);
    } else {
      setPlayerPos({ x: char.x, y: char.y });
      setTimeout(startBattleAction, 800);
    }
  };

  const handleEncounter = async (char: Character) => {
    if (gameState !== 'lobby' && gameState !== 'dungeon') return;
    
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setSelectedOpponent(char);

    const startRobotBattleAction = () => {
      if (isAutoBattle && (!isTutorialMode || tutorialStep < 1 || tutorialStep > 5)) {
        startRobotMatch(char);
      } else {
        setGameState('preMatch');
      }
    };

    if (isGpsActive && gpsCoords && char.lat && char.lng) {
      animatePlayerTo(char.lat, char.lng, startRobotBattleAction);
    } else {
      setPlayerPos({ x: char.x, y: char.y });
      setTimeout(startRobotBattleAction, 800);
    }
  };

  const startRobotMatch = (char: Character) => {
    const isMatgo = char.id === 'matgo-ai' || battleType === 'matgo';
    setBattleType(isMatgo ? 'matgo' : (char.id.startsWith('ranking-') ? 'pvp_attack' : 'robot'));
    setGameState('searching');
    setIsCoinFlipping(true);
    
    setTimeout(() => {
      const first = Math.random() > 0.5 ? 'player' : 'ai';
      setCoinWinner(first);
      setFirstTurn(first);
      
      const delay = Math.max(800, 1200 * speedMultiplier);
      setTimeout(() => {
        setIsCoinFlipping(false);
        setCoinWinner(null);
        startGame(char, first, isMatgo);
        setGameState('playing');
      }, delay);
    }, 1000 * speedMultiplier);
  };

  const generateAIOpponentDeck = (targetPower: number): CardData[] => {
    const allCards = Object.keys(CARD_DATABASE).map(Number);
    const deck: CardData[] = [];
    const selectedIndices = new Set<number>();
    
    // Scale target power based on difficulty with RANDOM VARIANCE
    let minRange = 0.9;
    let maxRange = 1.1;

    if (aiDifficulty === 'easy') {
      minRange = 0.75;
      maxRange = 0.95;
    } else if (aiDifficulty === 'hard') {
      minRange = 1.1;
      maxRange = 1.4;
    } else {
      // Medium
      minRange = 0.95;
      maxRange = 1.15;
    }
    
    // Apply random variance within the difficulty range
    const varianceFactor = minRange + Math.random() * (maxRange - minRange);
    const scaledTargetPower = targetPower * varianceFactor;
    
    // Each card's target power
    const targetPerCard = scaledTargetPower / 5;

    for (let i = 0; i < 5; i++) {
        // Find cards with power near the targetPerCard excluding already selected card indices
        let tolerance = 5;
        let candidates = allCards.filter(idx => {
            if (selectedIndices.has(idx)) return false;
            const p = CARD_DATABASE[idx].power;
            return Math.abs(p - targetPerCard) <= tolerance;
        });
        
        // Dynamic search for best fit
        while (candidates.length === 0 && tolerance < 200) {
            tolerance += 15;
            candidates = allCards.filter(idx => {
                if (selectedIndices.has(idx)) return false;
                const p = CARD_DATABASE[idx].power;
                return Math.abs(p - targetPerCard) <= tolerance;
            });
        }
        
        if (candidates.length === 0) {
            candidates = allCards.filter(idx => !selectedIndices.has(idx));
        }
        
        const selectedIdx = candidates.length > 0 
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : (allCards.find(idx => !selectedIndices.has(idx)) ?? allCards[0]);
            
        selectedIndices.add(selectedIdx);
        
        const cardInfo = CARD_DATABASE[selectedIdx];
        
        // --- REALISTIC POWER SCALING ---
        // Create an AI card with base stats
        const aiCard: CardData = {
            id: `ai-card-${i}-${Date.now()}-${selectedIdx}`,
            imageIndex: selectedIdx,
            title: cardInfo.title,
            title_dis: cardInfo.title_dis,
            title_en: cardInfo.title_en,
            power: cardInfo.power,
            rarity: cardInfo.rarity || 'bronze',
            owner: 'ai',
            stats: [...cardInfo.stats],
            ability: cardInfo.ability,
            element: cardInfo.element,
            skills: INITIAL_SKILLS.map(s => ({ ...s, level: 0 })),
            equipment: {},
            bonusPower: 0,
            exp: 0,
            level: 1
        };

        // 1. Apply Skills first (Simulation of level up)
        let currentPower = getCardPower(aiCard);
        if (currentPower < targetPerCard) {
            const deficit = targetPerCard - currentPower;
            if (deficit >= 4) {
                aiCard.skills = aiCard.skills?.map(s => ({ ...s, level: 5 }));
                aiCard.level = 10;
            } else if (deficit >= 2) {
                aiCard.skills = aiCard.skills?.map(s => ({ ...s, level: Math.random() > 0.5 ? 5 : 0 }));
                aiCard.level = 5;
            }
        }

        // 2. Equip Real Items from ITEM_DATABASE
        currentPower = getCardPower(aiCard);
        if (currentPower < targetPerCard) {
            const slots = ['necklace', 'ring1', 'ring2', 'boots'] as const;
            const shuffledSlots = [...slots].sort(() => Math.random() - 0.5);
            
            for (const slot of shuffledSlots) {
                const deficit = targetPerCard - currentPower;
                if (deficit <= 0) break;

                const possibleItems = ITEM_DATABASE.filter(item => item.slot === slot || (slot.startsWith('ring') && item.slot === 'ring1'));
                const itemsWithContribution = possibleItems.map(item => ({
                    item,
                    contribution: item.stats.reduce((a, b) => a + b, 0)
                })).sort((a, b) => b.contribution - a.contribution);

                let bestItemMatch = null;
                if (deficit > 10) {
                    bestItemMatch = itemsWithContribution[Math.floor(Math.random() * Math.min(5, itemsWithContribution.length))].item;
                } else {
                    const candidates = itemsWithContribution.filter(ic => ic.contribution <= deficit + 3);
                    if (candidates.length > 0) {
                        bestItemMatch = candidates[Math.floor(Math.random() * candidates.length)].item;
                    } else {
                        bestItemMatch = itemsWithContribution[itemsWithContribution.length - 1].item;
                    }
                }

                if (bestItemMatch) {
                    aiCard.equipment![slot] = { ...bestItemMatch, id: `ai-item-${slot}-${Date.now()}` };
                    currentPower = getCardPower(aiCard);
                }
            }
        }

        // Set final power score based on realistic stats
        aiCard.power = getCardPower(aiCard);
        deck.push(aiCard);
    }
    
    return ensureUniqueDeck(deck, 5);
  };

  useEffect(() => {
    if (gameState === 'preMatch') {
      if (selectedOpponent?.type === 'robot') {
          // Use opponent's totalPower for matching-based deck generation
          const targetPower = selectedOpponent.totalPower || playerDeck.reduce((acc, c) => {
             return acc + (c.power || 0);
          }, 0);
          setPreviewDeck(ensureUniqueDeck(generateAIOpponentDeck(targetPower), 5));
      } else if (selectedOpponent?.type === 'user' && (selectedOpponent as any).deck) {
          setPreviewDeck(ensureUniqueDeck((selectedOpponent as any).deck.map((c: any) => syncCardWithDatabase({ ...c, owner: 'ai' })), 5));
      }
    }
  }, [gameState, selectedOpponent, aiDifficulty, playerDeck]);

  const [opponentStrategy, setOpponentStrategy] = useState<AiStrategy>('balanced');

  const handleRematch = () => {
    if (battleType === 'pvp_attack' && hasExhausted) {
      setRematchCountdown(null);
      setShowInsufficientPopup(true);
      return;
    }

    setRematchCountdown(null);
    setGameOver(false);
    setWinner(null);
    setCheckingIdx(-1);
    setIsEvaluating(false);
    setShowOverwhelmingEffect(false);
    setShowStreakEffect(false);
    setCurrentWinStreakDisplay(0);
    
    setIsCoinFlipping(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setTimeout(() => {
      const firstTurn = Math.random() > 0.5 ? 'player' : 'ai';
      setCoinWinner(firstTurn);
      setFirstTurn(firstTurn);
      
      const delay = Math.max(800, 1200 * speedMultiplier);
      const isMatgo = battleType === 'matgo';
      setTimeout(() => {
        setIsCoinFlipping(false);
        setCoinWinner(null);
        startGame(undefined, firstTurn, isMatgo);
        setGameState('playing');
      }, delay);
    }, 800 * speedMultiplier);
  };

  const startMatgoGame = () => {
    const firstTurn: 'player' | 'ai' = Math.random() < 0.5 ? 'player' : 'ai';
    startGame(undefined, firstTurn, true);
  };

  const startGame = (opponent?: Character, firstTurn: 'player' | 'ai' = 'player', isMatgo: boolean = false) => {
    setFirstTurn(firstTurn);
    if (isMatgo) {
      setBattleType('matgo');
    } else {
      const finalOpponent = opponent || lastOpponent;
      const computedBattleType = finalOpponent?.id?.startsWith('ranking-') ? 'pvp_attack' : (finalOpponent?.type === 'user' ? 'user' : 'robot');
      setBattleType(computedBattleType);
      if (computedBattleType === 'pvp_attack') {
        if (setIsAutoBattle) setIsAutoBattle(true);
        if (setIsGpsActive) setIsGpsActive(false);
      }
    }

    try {
      setCheckingIdx(-1);
      setIsEvaluating(false);
      isProcessingRef.current = false;
      let oppDeck: CardData[];
      
      const effectiveOpponent = opponent || lastOpponent;

      // Assign a strategy to the AI opponent
      if (botAiStrategy === 'random') {
        const strategies: AiStrategy[] = ['balanced', 'aggressive', 'defensive'];
        setOpponentStrategy(strategies[Math.floor(Math.random() * strategies.length)]);
      } else {
        setOpponentStrategy(botAiStrategy);
      }
      
      if (effectiveOpponent?.type === 'user' && (effectiveOpponent as any).deck) {
         let baseOppDeck = (effectiveOpponent as any).deck;
         oppDeck = ensureUniqueDeck(baseOppDeck, 5).map((c: any) => syncCardWithDatabase({ ...c, owner: 'ai' }));
      } else if (!opponent && lastAiDeck) {
         // Rematch case with AI
         oppDeck = ensureUniqueDeck(lastAiDeck, 5).map(c => ({ ...c, owner: 'ai' }));
      } else {
          // New AI match or fresh generation
          if (previewDeck.length === 5) {
              oppDeck = ensureUniqueDeck(previewDeck, 5);
          } else {
              // Use opponent's totalPower if available (from matching), otherwise fallback to player power
              const targetPower = effectiveOpponent?.totalPower || playerDeck.reduce((acc, c) => {
                 return acc + (c.power || 0);
              }, 0);

              oppDeck = generateAIOpponentDeck(targetPower);
          }
         setLastAiDeck(oppDeck);
      }

      // Ensure oppDeck is 100% strictly 5 unique cards (no duplicate card IDs/imageIndex)
      oppDeck = ensureUniqueDeck(oppDeck, 5).map((c, i) => ({ ...c, owner: 'ai' as const, id: `ai-${Date.now()}-${i}-${c.imageIndex ?? i}` }));

      if (effectiveOpponent) setLastOpponent(effectiveOpponent);
      
      setOpponentDeck(oppDeck.map(c => ({ ...c, owner: 'ai' })));
      setOpponentHand(oppDeck);
      
      // Determine Adaptive AI Strategy for PLAYER's auto-battle based on past patterns
      if (patterns) {
        let strategy: AiStrategy = 'balanced';
        const { aggressionScore, lastTenResults } = patterns;
        
        // Counter high aggression with defensive play
        if (aggressionScore > 0.6) strategy = 'defensive';
        // Punish low aggression with balanced/aggressive play
        else if (aggressionScore < 0.3) strategy = 'aggressive';

        // Adjust based on win/loss momentum
        const recentWins = lastTenResults.filter(r => r === 'win').length;
        if (recentWins > 6) strategy = 'aggressive'; // AI becomes more aggressive if player is winning too much
        
        setAdaptiveStrategy(strategy);
      } else {
        setAdaptiveStrategy('balanced');
      }

      setSessionPatterns({
        placements: Array(9).fill(0),
        aggressionScore: 0,
        totalMovesTracked: 0,
        lastTenResults: []
      });
      
      if (isMatgo) {
        const allCards: CardData[] = Object.keys(CARD_DATABASE).map((key, i) => {
          const dbCard = CARD_DATABASE[Number(key)];
          return {
            id: `matgo-${dbCard.id}-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
            title: dbCard.title,
            title_dis: dbCard.title_dis,
            title_en: dbCard.title_en,
            stats: [...dbCard.stats],
            rarity: dbCard.rarity,
            owner: null,
            level: 1,
            imageIndex: dbCard.id,
            skills: [...INITIAL_SKILLS.map(s => ({ ...s }))]
          };
        });

        const shuffleDeck = (deck: CardData[]) => {
          const shuffled = [...deck];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };

        const shuffledDeck = shuffleDeck(allCards);

        const pHand = shuffledDeck.slice(0, 5).map((c, i) => ({ 
          ...c, 
          owner: 'player' as const,
          id: `player-matgo-${Date.now()}-${i}`
        }));
        const oppHand = shuffledDeck.slice(5, 10).map((c, i) => ({ 
          ...c, 
          owner: 'ai' as const,
          id: `ai-matgo-${Date.now()}-${i}`
        }));

        setPlayerHand(pHand);
        setOpponentHand(oppHand);
        setOpponentDeck(oppHand);

        const initStacks: { [key: number]: CardData[] } = {
          0: [shuffledDeck[10]],
          1: [],
          2: [shuffledDeck[11]],
          3: [],
          4: [], 
          5: [],
          6: [shuffledDeck[12]],
          7: [],
          8: [shuffledDeck[13]]
        };
        setMatgoBoardStacks(initStacks);
        setMatgoDeck(shuffledDeck.slice(14));

        const initialBoard = Array(9).fill(null);
        initialBoard[0] = shuffledDeck[10];
        initialBoard[2] = shuffledDeck[11];
        initialBoard[6] = shuffledDeck[12];
        initialBoard[8] = shuffledDeck[13];
        setBoard(initialBoard);
        setMatgoScores({ player: 0, ai: 0 });

        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setElementalBoard(Array(9).fill(null));
        resetQteState();
        setGameState('playing');
        setTurn(firstTurn);
        setGameOver(false);
        setWinner(null);
        setRewardEarned(0);
        hasRecordedResult.current = false;
        setTurn(firstTurn);
        addLog(language === 'ko' ? `[ÎßûÍ≥†ÎåÄÏ†Ñ] ${firstTurn === 'player' ? 'ÏÇ¨Ïö©Ïûê' : 'AI'} ÏÑ†Í≥µÏúºÎ°ú Î∞∞ÌãÄ ÏãúÏûë` : `Matgo Battle started with ${firstTurn}'s turn`, 'system');
      } else {
        let baseDeck = (orderedPlayerDeck && orderedPlayerDeck.length > 0 ? orderedPlayerDeck : (playerDeck && playerDeck.length > 0 ? playerDeck : INITIAL_CARDS));
        if (baseDeck.length < 5) {
          baseDeck = [...baseDeck];
          while (baseDeck.length < 5) {
            baseDeck.push(INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)]);
          }
        }
        
        const pHand = baseDeck
          .slice(0, 5)
          .map((c, i) => syncCardWithDatabase({ ...c, owner: 'player' as const, id: `player-${Date.now()}-${i}` }));
        
        const playerDeckPower = pHand.reduce((acc, c) => {
          return acc + (c.power || 0);
        }, 0) || 10;
        setAiSimulatedTotalPower(Math.floor(playerDeckPower * (0.8 + Math.random() * 0.4)));
        setPlayerHand(pHand);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setBoard(Array(9).fill(null));
        
        // Randomize Elemental Board (25% chance per tile)
        const elements: (string | null)[] = Array(9).fill(null);
        const possibleElements = ['water', 'fire', 'wind', 'land', 'human', 'undead', 'elf', 'dwarf', 'monster', 'robot', 'dragon'];
        for (let i = 0; i < 9; i++) {
          if (Math.random() < 0.25) {
            elements[i] = possibleElements[Math.floor(Math.random() * possibleElements.length)];
          }
        }
        setElementalBoard(elements);
        resetQteState();
        setGameState('playing');
        setTurn(firstTurn);
        setGameOver(false);
        setWinner(null);
        setRewardEarned(0);
        hasRecordedResult.current = false;
        setTurn(firstTurn);
        addLog(language === 'ko' ? `${firstTurn === 'player' ? 'ÏÇ¨Ïö©Ïûê' : 'AI'} ÏÑ†Í≥µÏúºÎ°ú Î∞∞ÌãÄ ÏãúÏûë` : `Battle started with ${firstTurn} turn`, 'system');
      }
    // Analytics: Track Game Start
    if (analytics) {
      logEvent(analytics, 'game_start', {
        opponent_type: opponent?.type || 'unknown',
        ai_difficulty: aiDifficulty,
        first_turn: firstTurn
      });
    }
    } catch (err) {
      console.error("Failed to start game:", err);
      // Fallback to lobby on error
      setGameState('lobby');
    }
  };

  const getFlips = (
    testBoard: (CardData | null)[],
    index: number,
    placedCard: CardData,
    owner: 'player'|'ai',
    isDryRun: boolean = false,
    activeQteMultiplier: number = 1,
  ) => {
    const flippedIndices: number[] = [];
    const sameMatched: number[] = [];
    const plusSums: Record<number, number[]> = {};
    const highlights: Record<number, number[]> = {};
    let counterTargetOwner: 'player' | 'ai' | null = null;

    const row = Math.floor(index / 3);
    const col = index % 3;
    
    // Track stats for the placed card
    const myHighlights: number[] = [];

    const flipDetails: { index: number; attacker: CardData; victim: CardData; myStat: number; oppStat: number; damageDiff: number }[] = [];

    const directions = [
      { r: -1, c: 0, m: 0, o: 2 },
      { r: 0, c: 1, m: 1, o: 3 },
      { r: 1, c: 0, m: 2, o: 0 },
      { r: 0, c: -1, m: 3, o: 1 },
    ];
    directions.forEach(dir => {
      const nr = row + dir.r;
      const nc = col + dir.c;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
        const ni = nr * 3 + nc;
        const neighbor = testBoard[ni];
        if (neighbor) {
          const suddenDeathBonus = testBoard.filter(c => c !== null).length >= 6 ? 2 : 0;
          const placedSynergy = calculateBattleSynergy(placedCard, neighbor, placedCard.equipment);
          const defendingSynergy = calculateBattleSynergy(neighbor, placedCard, neighbor.equipment);
          
          // Item 356: Elemental Synergy Combo (Resonance / Amplification)
          const elemCombo = calculateElementalComboBonus(placedCard, neighbor, neighbor.owner === owner);
          const elemComboBonus = elemCombo.bonus;
          if (elemComboBonus > 0 && !isDryRun && owner === 'player') {
            setHasTriggeredElementalCombo(true);
            if (elemCombo.logTextKo && elemCombo.logTextEn) {
              addLog(language === 'ko' ? elemCombo.logTextKo : elemCombo.logTextEn, 'system');
            }
          }

          let myStat = getCardStatWithBonus(placedCard, dir.m, elementalBoard[index]) + placedSynergy.equipmentStatBonus[dir.m] + suddenDeathBonus + elemComboBonus;
          let oppStat = getCardStatWithBonus(neighbor, dir.o, elementalBoard[ni]) + defendingSynergy.equipmentStatBonus[dir.o] + suddenDeathBonus;

          myStat *= placedSynergy.factionMultiplier;
          oppStat *= defendingSynergy.factionMultiplier;

          // SAME rule
          if (myStat === oppStat) {
            sameMatched.push(ni);
            myHighlights.push(dir.m);
            if (!highlights[ni]) highlights[ni] = [];
            if (!highlights[ni].includes(dir.o)) highlights[ni].push(dir.o);
          }
          
          // PLUS rule
          const sum = myStat + oppStat;
          if (!plusSums[sum]) plusSums[sum] = [];
          plusSums[sum].push(ni);

          if (neighbor.owner !== owner) {
            // WALL Ability check
            if (neighbor.ability?.type === 'WALL' && placedCard.ability?.type !== 'PIERCE') {
              if (!isDryRun) addLog(t('log_wall_blocked', language, { owner: placedCard.owner === 'player' ? t('you', language) : t('system_ai', language) }), 'info');
              return;
            } else if (neighbor.ability?.type === 'WALL' && placedCard.ability?.type === 'PIERCE') {
              if (!isDryRun) addLog(t('log_pierce_wall', language, { sector: ni + 1 }), 'system');
            }

            // SHIELD Ability check
            if (neighbor.ability?.type === 'SHIELD' && placedCard.ability?.type !== 'PIERCE') {
              myStat = Math.max(0, myStat - neighbor.ability.value);
            } else if (neighbor.ability?.type === 'SHIELD' && placedCard.ability?.type === 'PIERCE') {
              if (!isDryRun) addLog(t('log_pierce_shield', language), 'info');
            }

            // Apply QTE boost only to the player's active placement
            if (owner === 'player') myStat *= activeQteMultiplier;
            if (myStat > oppStat) {
              flippedIndices.push(ni);
              flipDetails.push({ index: ni, attacker: placedCard, victim: neighbor, myStat, oppStat, damageDiff: myStat - oppStat });
              myHighlights.push(dir.m);
              if (!highlights[ni]) highlights[ni] = [];
              if (!highlights[ni].includes(dir.o)) highlights[ni].push(dir.o);
            } else if (neighbor.ability?.type === 'COUNTER' && placedCard.ability?.type !== 'IMMUNITY') {
              counterTargetOwner = neighbor.owner as 'player' | 'ai';
            }
          }
        }
      }
    });

    // Finalize combos
    let comboFlipped = false;
    if (sameMatched.length >= 2) {
      sameMatched.forEach(ni => {
        if (testBoard[ni]?.owner !== owner && testBoard[ni]?.ability?.type !== 'IMMUNITY') {
          flippedIndices.push(ni);
          comboFlipped = true;
        }
      });
    }
    Object.values(plusSums).forEach(indices => {
      if (indices.length >= 2) {
        indices.forEach(ni => {
          if (testBoard[ni]?.owner !== owner && testBoard[ni]?.ability?.type !== 'IMMUNITY') {
            flippedIndices.push(ni);
            comboFlipped = true;
            // Also add highlights for PLUS rule victims
            // Find direction
            const niRow = Math.floor(ni / 3);
            const niCol = ni % 3;
            directions.forEach(d => {
              if (row + d.r === niRow && col + d.c === niCol) {
                myHighlights.push(d.m);
                if (!highlights[ni]) highlights[ni] = [];
                if (!highlights[ni].includes(d.o)) highlights[ni].push(d.o);
              }
            });
          }
        });
      }
    });

    if (myHighlights.length > 0) highlights[index] = Array.from(new Set(myHighlights));

    if (comboFlipped && !isDryRun) {
      setLastCombo({ count: flippedIndices.length, timestamp: Date.now() });
      addLog(t('log_combo_activated', language), 'capture');
    }

    return { indices: Array.from(new Set(flippedIndices)), flipDetails, highlights, counterTargetOwner };
  };

  const triggerCardAbility = (boardState: (CardData | null)[], index: number) => {
    const card = boardState[index];
    if (!card || !card.ability) return;

    const cardTitle = getFormattedCardName(card, language);
    let activationText = "";

    if (card.ability.type === 'OMNIBOOST') {
      boardState.forEach((cell, idx) => {
        if (cell && cell.owner === card.owner) {
          boardState[idx] = { ...cell, stats: cell.stats.map(s => s + card.ability!.value) as [number, number, number, number] };
          triggerStatFX(idx, `+${card.ability!.value}`, true);
        }
      });
      activationText = language === 'ko'
        ? `‚ú® [Ïä§ÌÇ¨ Î∞úÎèô] [${cardTitle}]Ïùò 'Ï†ÑÏ≤¥ Í≥†Ïñë': ÏïÑÍµ∞ Ïπ¥Îìú Ïä§ÌÉØ +${card.ability.value} Î≤ÑÌîÑ!`
        : `‚ú® [SKILL] [${cardTitle}]'s 'Omniboost': All ally cards +${card.ability.value} stats!`;
    } else if (card.ability.type === 'TIME_WARP') {
      activationText = language === 'ko'
        ? `‚ú® [Ïä§ÌÇ¨ Î∞úÎèô] [${cardTitle}]Ïùò 'ÏãúÍ∞Ñ ÏôúÍ≥°': ÏÉÅÎåÄÎ∞© Îã§Ïùå ÌÑ¥ Ïä§ÌÇµ!`
        : `‚ú® [SKILL] [${cardTitle}]'s 'Time Warp': Opponent's next turn skipped!`;
    }

    const row = Math.floor(index / 3);
    const col = index % 3;
    const directions = [{r:-1, c:0}, {r:0, c:1}, {r:1, c:0}, {r:0, c:-1}];

    directions.forEach(dir => {
      const nr = row + dir.r;
      const nc = col + dir.c;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
        const ni = nr * 3 + nc;
        const neighbor = boardState[ni];
        if (!neighbor) return;

        const neighborTitle = getFormattedCardName(neighbor, language);

        if (card.ability?.type === 'POWER_BOOST' && neighbor.owner === card.owner) {
          boardState[ni] = { ...neighbor, stats: neighbor.stats.map(s => s + card.ability!.value) as [number, number, number, number] };
          triggerStatFX(ni, `+${card.ability!.value}`, true);
          activationText = language === 'ko'
            ? `‚ú® [Ïä§ÌÇ¨ Î∞úÎèô] [${cardTitle}]Ïùò 'ÌååÏõå Ï¶ùÌè≠': [${neighborTitle}] Ïä§ÌÉØ +${card.ability.value}`
            : `‚ú® [SKILL] [${cardTitle}]'s 'Power Boost': [${neighborTitle}] +${card.ability.value} stats`;
        } else if (card.ability?.type === 'WEAKEN' && neighbor.owner !== card.owner) {
          if (neighbor.ability?.type === 'IMMUNITY') {
             // IMMUNITY blocks Weaken
             addLog(language === 'ko'
               ? `üõ°Ô∏è [Ïä§ÌÇ¨ Î∞©Ïñ¥] [${neighborTitle}]Ïùò 'Î©¥Ïó≠': ÏïΩÌôî ÎîîÎ≤ÑÌîÑ Î¨¥Ìö®Ìôî!`
               : `üõ°Ô∏è [SKILL BLOCK] [${neighborTitle}]'s 'Immunity': Weaken resisted!`, 'info');
             return;
          }
          boardState[ni] = { ...neighbor, stats: neighbor.stats.map(s => Math.max(0, s - card.ability!.value)) as [number, number, number, number] };
          triggerStatFX(ni, `-${card.ability!.value}`, false);
          activationText = language === 'ko'
            ? `‚ú® [Ïä§ÌÇ¨ Î∞úÎèô] [${cardTitle}]Ïùò 'ÏïΩÌôî ÎîîÎ≤ÑÌîÑ': [${neighborTitle}] Ïä§ÌÉØ -${card.ability.value}`
            : `‚ú® [SKILL] [${cardTitle}]'s 'Weaken': [${neighborTitle}] -${card.ability.value} stats`;
        } else if (card.ability?.type === 'REINFORCE' && neighbor.owner === card.owner) {
          const currentSelf = boardState[index]!;
          boardState[index] = { ...currentSelf, stats: currentSelf.stats.map(s => s + card.ability!.value) as [number, number, number, number] };
          triggerStatFX(index, `+${card.ability!.value}`, true);
          activationText = language === 'ko'
            ? `‚ú® [Ïä§ÌÇ¨ Î∞úÎèô] [${cardTitle}]Ïùò 'ÏûêÏ≤¥ Í∞ïÌôî': Ïä§ÌÉØ +${card.ability.value}`
            : `‚ú® [SKILL] [${cardTitle}]'s 'Reinforce': Self stat +${card.ability.value}`;
        } else if (card.ability?.type === 'WALL') {
          activationText = language === 'ko'
            ? `üõ°Ô∏è [Ïä§ÌÇ¨ Ìö®Í≥º] [${cardTitle}]Ïùò 'Ï≤†Î≤Ω Î∞©Ïñ¥': Î¨ºÎ¶¨ Í≥µÍ≤© Ï∞®Îã® ÌÉúÏÑ∏`
            : `üõ°Ô∏è [SKILL] [${cardTitle}]'s 'Wall': Block stance active`;
        } else if (card.ability?.type === 'PIERCE') {
          activationText = language === 'ko'
            ? `‚ö° [Ïä§ÌÇ¨ Ìö®Í≥º] [${cardTitle}]Ïùò 'Í¥ÄÌÜµ': ÏÉÅÎåÄÎ∞© Î∞©Ïñ¥ ÌÉúÏÑ∏ Î¨¥Ïãú`
            : `‚ö° [SKILL] [${cardTitle}]'s 'Pierce': Ignores enemy shields`;
        }
      }
    });

    if (activationText) {
      addLog(activationText, 'system');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Tech Ability Sound
    }
  };

  const resolveCombatDelay = (
    unflippedBoard: (CardData | null)[], 
    boardIdx: number, 
    onComplete: (finalBoard: (CardData | null)[], skipTurn?: boolean) => void,
    activeQteMultiplier: number = 1,
  ) => {
    // Remove the 700ms artificial delay and highlight rendering to reduce lag
    // Process combat immediately
    const finalBoard = [...unflippedBoard];
    const result = checkFlips(finalBoard, boardIdx, activeQteMultiplier);
    onComplete(finalBoard, result === 'skip_turn');
  };

  const checkFlips = (newBoard: (CardData | null)[], index: number, activeQteMultiplier: number = 1): 'skip_turn' | undefined => {
    // Process trap if exists
    if (boardTraps[index]) {
      const trapType = boardTraps[index];
      const card = newBoard[index];
      if (card) {
        if (trapType === 'purple') {
          newBoard[index] = {
            ...card,
            stats: card.stats.map(s => Math.max(0, s - 1)) as [number, number, number, number]
          };
          triggerStatFX(index, '-1 TRAP', false);
          addLog(t('log_weaken_trap', language, { unit: getFormattedCardName(card, language) }), 'system');
        } else if (trapType === 'red') {
          newBoard[index] = {
            ...card,
            stats: card.stats.map(s => s + 1) as [number, number, number, number]
          };
          triggerStatFX(index, '+1 TRAP', true);
          addLog(t('log_reinforce_trap', language, { unit: getFormattedCardName(card, language) }), 'system');
        }
      }
      setBoardTraps(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }

    const placedCard = newBoard[index]!;

    // Check elemental tile bonus/malus FX
    if (elementalBoard[index]) {
      const cardEl = getNormalizedElement(placedCard);
      const tileEl = getNormalizedElement({ element: elementalBoard[index] } as any);
      if (cardEl && tileEl) {
        if (cardEl === tileEl) {
          triggerStatFX(index, '+1 ELEM', true);
        } else {
          triggerStatFX(index, '-1 ELEM', false);
        }
      }
    }

    // Item 355: Check Mana Spring Tile bonus (+2 all stats for placing card)
    if (manaSpringTileIndex === index) {
      newBoard[index] = {
        ...placedCard,
        stats: placedCard.stats.map(s => s + 2) as [number, number, number, number]
      };
      triggerStatFX(index, '+2 MANA', true);
      if (placedCard.owner === 'player') {
        setManaSpringClaimed(true);
        addLog(language === 'ko'
          ? `üíß [ÎßàÎÇòÏÉò Ï†êÎ†π] ${index + 1}Î≤à Íµ¨Ïó≠ ÎßàÎÇòÏÉòÏùÑ Ï†êÎ†πÌñàÏäµÎãàÎã§! Î™®Îì† Î∞©Ìñ• Îä•Î†•Ïπò +2 Î∞è +10 SNS Î≥¥ÎÑàÏä§ ÌôïÎ≥¥!`
          : `üíß [MANA SPRING] Captured Mana Spring on Sector ${index + 1}! All stats +2 & +10 SNS bounty secured!`,
          'system'
        );
      } else {
        addLog(language === 'ko'
          ? `üíß [AI ÎßàÎÇòÏÉò Ï†êÎ†π] AIÍ∞Ä ${index + 1}Î≤à Íµ¨Ïó≠ ÎßàÎÇòÏÉòÏùÑ Ï†êÎ†πÌñàÏäµÎãàÎã§!`
          : `üíß [AI MANA SPRING] AI secured Mana Spring on Sector ${index + 1}!`,
          'info'
        );
      }
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    // Item 375: Rage Spark Slot bonus (+3 all directional stats)
    if (rageSparkSlotIndex === index) {
      newBoard[index] = {
        ...placedCard,
        stats: placedCard.stats.map(s => s + 3) as [number, number, number, number]
      };
      triggerStatFX(index, '+3 RAGE', true);
      const unitName = getFormattedCardName(placedCard, language);
      addLog(language === 'ko'
        ? `üî• [Î∂ÑÎÖ∏ Í∞ÅÏÑ± Ìè≠Ï£º] [${unitName}] Ïπ¥ÎìúÍ∞Ä Î∂ÑÎÖ∏ Í∞ÅÏÑ± ÌÉÄÏùºÏùò ÌûòÏúºÎ°ú Ï†Ñ Î∞©Ìñ• ÌååÏõå +3 Ìè≠Ï£º ÏÉÅÌÉúÏóê ÎèåÏûÖÌñàÏäµÎãàÎã§!`
        : `üî• [RAGE SPARK FRENZY] [${unitName}] empowered by Rage Spark (+3 All Stats)!`,
        'victory'
      );
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    // Item 371: Wind Gust Knockback Displacement Mechanic
    const isWindCard = getNormalizedElement(placedCard) === 'wind' || placedCard.element === 'air' || placedCard.element === 'wind';
    if (isWindCard) {
      const wRow = Math.floor(index / 3);
      const wCol = index % 3;
      const wDirs = [
        { r: -1, c: 0 },
        { r: 0, c: 1 },
        { r: 1, c: 0 },
        { r: 0, c: -1 }
      ];
      wDirs.forEach(d => {
        const nr = wRow + d.r;
        const nc = wCol + d.c;
        if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
          const adjIdx = nr * 3 + nc;
          const adjCard = newBoard[adjIdx];
          if (adjCard && adjCard.owner !== placedCard.owner) {
            const pushR = nr + d.r;
            const pushC = nc + d.c;
            if (pushR >= 0 && pushR < 3 && pushC >= 0 && pushC < 3) {
              const pushIdx = pushR * 3 + pushC;
              if (newBoard[pushIdx] === null) {
                newBoard[pushIdx] = adjCard;
                newBoard[adjIdx] = null;
                triggerStatFX(pushIdx, 'üå™Ô∏è GUST', false);
                const victimName = getFormattedCardName(adjCard, language);
                addLog(language === 'ko'
                  ? `üå™Ô∏è [ÏúàÎìú Í±∞Ïä§Ìä∏] ÌíçÏÜçÏÑ± ÎèåÌíçÏúºÎ°ú [${victimName}] Ïπ¥ÎìúÍ∞Ä ${pushIdx + 1}Î≤à Íµ¨Ïó≠ÏúºÎ°ú Î∞ÄÎ†§ÎÇ¨ÏäµÎãàÎã§!`
                  : `üå™Ô∏è [WIND GUST] Gale knocked [${victimName}] backwards into Sector ${pushIdx + 1}!`,
                  'system'
                );
              }
            }
          }
        }
      });
    }

    // Item 359: Central Core Element Switch Mechanism (Cross tiles rotate)
    if (index === 4) {
      const ELEMENT_CYCLE: Record<string, string> = { 
        water: 'fire', fire: 'wind', wind: 'land', land: 'water',
        elf: 'dwarf', dwarf: 'monster', monster: 'robot', robot: 'dragon', dragon: 'human', human: 'undead', undead: 'elf'
      };
      setElementalBoard(prev => prev.map((el, i) => ([1, 3, 5, 7].includes(i) && el && ELEMENT_CYCLE[el]) ? ELEMENT_CYCLE[el] : el));
      triggerStatFX(4, 'üîÑ SWITCH', true);
      addLog(language === 'ko'
        ? `üîÑ [ÏÜçÏÑ± Ïä§ÏúÑÏπò (Element Switch)] Ï§ëÏïô Ï†úÏñ¥ ÌÉÄÏùºÏóê Ïπ¥ÎìúÍ∞Ä Î∞∞ÏπòÎêòÏñ¥ Ïã≠Ïûê Î∞©Ìñ• ÏÜçÏÑ±Ïù¥ ÏàúÌôò Ï†ÑÌôòÎê©ÎãàÎã§! (Î¨º‚ÜíÎ∂à‚ÜíÎ∞îÎûå‚ÜíÎåÄÏßÄ)`
        : `üîÑ [ELEMENT SWITCH] Center core activated! Cross element tiles shifted!`,
        'system'
      );
    }

    // Ability trigger BEFORE flips calculation (for things like WEAKEN/REINFORCE)
    triggerCardAbility(newBoard, index);

    const { indices: flippedIndices, flipDetails, highlights, counterTargetOwner } = getFlips(
      newBoard,
      index,
      placedCard,
      placedCard.owner as 'player'|'ai',
      false,
      activeQteMultiplier,
    );

    // Item 360: Track AI captures of player's cards for Ironclad Defender bonus
    if (placedCard.owner === 'ai' && flippedIndices.length > 0) {
      playerCardsCapturedByAi.current += flippedIndices.length;
    }

    // Item 372 & Item 380: Track shield breaks and 9th turn clutch ace flips
    if (placedCard.owner === 'player' && flippedIndices.length > 0) {
      flippedIndices.forEach(ni => {
        const victimCard = newBoard[ni];
        if (victimCard && (victimCard.ability?.type === 'SHIELD' || victimCard.ability?.type === 'WALL' || (victimCard.power && victimCard.power >= 150))) {
          bossShieldBreaksCount.current += 1;
        }
      });
      if (board.filter(c => c !== null).length === 8 && flippedIndices.length >= 3) {
        isClutchAceBreaker.current = true;
      }
    }
    
    if (highlights && Object.keys(highlights).length > 0) {
      setCombatHighlights(highlights);
      // Clear after a short delay
      setTimeout(() => setCombatHighlights({}), 2000);
    }

    if (flippedIndices.length > 0) {
      flippedIndices.forEach(ni => triggerCellDamage(ni));
      setTimeout(() => {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'); // Capture/Flip Sound
      }, 150);
      
      if (flipDetails && flipDetails.length > 0) {
        flipDetails.forEach(detail => {
          triggerCellDamage(detail.index);
          const attackerOwner = placedCard.owner === 'player' ? (language === 'ko' ? 'ÌîåÎ†àÏù¥Ïñ¥' : 'Player') : (language === 'ko' ? 'AI' : 'AI');
          const attackerTitle = getFormattedCardName(detail.attacker, language);
          const victimTitle = getFormattedCardName(detail.victim, language);
          const pwrAtk = Math.round(detail.myStat);
          const pwrDef = Math.round(detail.oppStat);
          const diff = Math.round(detail.damageDiff);
          const sec = detail.index + 1;

          if (language === 'ko') {
            addLog(`‚öîÔ∏è [Ï†ÑÌà¨] ${attackerOwner}Ïùò [${attackerTitle}](ÌååÏõå ${pwrAtk})Í∞Ä ${sec}Î≤à Íµ¨Ïó≠ [${victimTitle}](ÌååÏõå ${pwrDef}) Í≥µÍ≤©! (ÎåÄÎØ∏ÏßÄ Ï∞®Ïù¥: +${diff}) ‚Üí ${victimTitle} Ï∫°Ï≤ò!`, 'capture');
          } else {
            addLog(`‚öîÔ∏è [COMBAT] ${attackerOwner}'s [${attackerTitle}](PWR ${pwrAtk}) attacked Sector ${sec} [${victimTitle}](PWR ${pwrDef})! (Diff: +${diff}) ‚Üí ${victimTitle} Captured!`, 'capture');
          }
        });
      } else {
        flippedIndices.forEach(ni => {
          const capturedCard = newBoard[ni];
          if (capturedCard) {
            addLog(t('log_captured', language, { 
              owner: placedCard.owner === 'player' ? t('you', language) : t('system_ai', language), 
              unit: getFormattedCardName(capturedCard, language), 
              sector: ni + 1 
            }), 'capture');
          }
        });
      }

      if (flippedIndices.length >= 2) {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'); // Critical capture sound
        addLog(t('log_critical_capture', language, { count: flippedIndices.length }), 'system');
        setLastCombo({ count: flippedIndices.length, timestamp: Date.now() });
      }

      // Item 394 & Item 402, Item 406 (Z-Lightning), Item 410 (Elemental L-Storm)
      let detectedComboType: 'NORMAL' | 'DOUBLE' | 'TRIPLE' | 'MEGA' | 'SAME' | 'PLUS' | 'DOMINO' | 'Z_LIGHTNING' | 'L_STORM' | null = null;
      
      // Check Z-shape (indices: [0,1,2,4,6,7,8] or [0,1,4,7,8])
      const playerIndices = newBoard
        .map((c, i) => (c && c.owner === 'player' ? i : -1))
        .filter(i => i !== -1);
      
      const isZFormation = (
        [0, 1, 4, 7, 8].every(idx => playerIndices.includes(idx)) ||
        [2, 1, 4, 7, 6].every(idx => playerIndices.includes(idx))
      );

      // Check L-shape (indices: [0,3,6,7,8] or [2,5,8,7,6] or [0,1,2,5,8])
      const isLFormation = (
        [0, 3, 6, 7, 8].every(idx => playerIndices.includes(idx)) ||
        [2, 5, 8, 7, 6].every(idx => playerIndices.includes(idx)) ||
        [0, 1, 2, 5, 8].every(idx => playerIndices.includes(idx))
      );

      if (isZFormation) detectedComboType = 'Z_LIGHTNING';
      else if (isLFormation) detectedComboType = 'L_STORM';
      else if (flippedIndices.length >= 4) detectedComboType = 'MEGA';
      else if (flippedIndices.length === 3) detectedComboType = 'TRIPLE';
      else if (flippedIndices.length === 2) detectedComboType = 'DOUBLE';
      else detectedComboType = 'NORMAL';

      setComboAnnounceData({
        comboType: detectedComboType,
        comboCount: isZFormation || isLFormation ? 5 : flippedIndices.length,
        isCriticalShatter: flippedIndices.length >= 2 || isZFormation || isLFormation,
        maxPowerDiff: isZFormation || isLFormation ? 10 : flippedIndices.length * 2,
      });
      setTimeout(() => setComboAnnounceData(null), 1800);

      // Item 396: 0.3s Clutch Slow-Motion Effect on 9th move or high-stakes flip
      const totalPlaced = newBoard.filter(c => c !== null).length;
      if (totalPlaced >= 8 || flippedIndices.length >= 3) {
        setIsClutchSlowMo(true);
        setTimeout(() => setIsClutchSlowMo(false), 350);
      }

      // Item 397: Secret Stamp Check (Triple Flip Master)
      if (placedCard.owner === 'player' && flippedIndices.length >= 3) {
        const unlocked = unlockSecretStamp('TRIPLE_COMBO_MASTER');
        if (unlocked) {
          addLog(`üìú [ÎπÑÎ∞Ä ÏóÖÏ†Å Îã¨ÏÑ±] [${unlocked.titleKo}] Í≥®Îì† Ïä§ÌÉ¨ÌîÑÎ•º ÌöçÎìùÌñàÏäµÎãàÎã§!`, 'victory');
        }
      }

      // Item 400: Double Weakness Break check for Boss Raids
      if (isBossActive && placedCard.owner === 'player' && flippedIndices.length >= 2) {
        setHasTriggeredDoubleBreak(true);
        const unlocked = unlockSecretStamp('DOUBLE_WEAKNESS_BREAKER');
        if (unlocked) {
          addLog(`üìú [ÎπÑÎ∞Ä ÏóÖÏ†Å Îã¨ÏÑ±] [${unlocked.titleKo}] Î≥¥Ïä§ 2Ïó∞ÏÜç ÏïΩÏ†ê ÌååÏáÑ!`, 'victory');
        }
      }

      // Item 386: Cross Domination (4 simultaneous flips)
      if (flippedIndices.length >= 4) {
        setIsCrossDominationActive(true);
        setTimeout(() => setIsCrossDominationActive(false), 2000);
        addLog(language === 'ko'
          ? '‚ú® [ÌÅ¨Î°úÏä§ ÎèÑÎØ∏ÎÑ§Ïù¥ÏÖò (Cross Domination)] 4Î∞©Ìñ• Ïã≠Ïûê ÎèôÏãú Ï∫°Ï≤ò Ï∂©Í≤©Ìåå Ìè≠Î∞ú!'
          : '‚ú® [CROSS DOMINATION] 4-way cross simultaneous capture shockwave triggered!',
          'victory'
        );
      }

      // Item 388: Fever Mode Combo accumulation (2x currency multiplier)
      if (placedCard.owner === 'player' && flippedIndices.length > 0) {
        setFeverMeter(prev => {
          const next = prev + flippedIndices.length;
          if (next >= 3 && prev < 3) {
            addLog(language === 'ko'
              ? 'üî• [ÌîºÎ≤Ñ ÌÉÄÏûÑ (Fever Mode) Î∞úÎèô] Ìô©Í∏à Î∂àÍΩÉ ÌôúÏÑ±Ìôî! Ï†ÑÌà¨ Î≥¥ÏÉÅ Ïû¨Ìôî 2Î∞∞ Ï†ÅÏö©!'
              : 'üî• [FEVER MODE ACTIVATED] Golden flames roaring! 2x Reward multiplier active!',
              'victory'
            );
          }
          return next;
        });
      }

      // Item 390: 2D Micro Screen Shake on 3+ combo flips
      if (flippedIndices.length >= 3) {
        setIsMicroShaking(true);
        setTimeout(() => setIsMicroShaking(false), 250);
      }
    } else {
      // Defense Success SFX & log (ID 82)
      setTimeout(() => {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      }, 150);
      addLog(language === 'ko' ? 'Î∞©Ïñ¥ ÏÑ±Í≥µ! Ïπ¥ÎìúÍ∞Ä ÏõêÎûò ÏÜåÏú†Í∂åÏùÑ Ïú†ÏßÄÌñàÏäµÎãàÎã§.' : 'DEFENSE SUCCESS! Position held.', 'system');
    }
    flippedIndices.forEach(ni => {
      if (newBoard[ni]) {
        newBoard[ni] = { ...newBoard[ni]!, owner: placedCard.owner };
      }
    });

    if (counterTargetOwner) {
      newBoard[index] = { ...newBoard[index]!, owner: counterTargetOwner };
      addLog(t('log_countered', language, { unit: placedCard.title_en || placedCard.title }), 'system');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    }

    if (placedCard.ability?.type === 'TIME_WARP') return 'skip_turn';
  };

  const startShadowMatch = () => {
    setGameState('playing');
    setBattleType('user'); // We treat it as user match for visuals
    setIsShadowMatch(true);
    setCheckingIdx(-1);
    setIsEvaluating(false);

    // Exact mirror of player deck
    let myDeck = (playerDeck && playerDeck.length > 0 ? playerDeck : INITIAL_CARDS);
    if (myDeck.length < 5) {
      myDeck = [...myDeck];
      while (myDeck.length < 5) {
        myDeck.push(INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)]);
      }
    }
    myDeck = myDeck
        .slice(0, 5)
        .map(c => syncCardWithDatabase({ ...c, owner: 'player' as const }));
    
    // Deep clone but with 'ai' owner for red color coding
    const oppDeck = myDeck.map(c => ({ ...c, owner: 'ai' as const }));

    setOpponentDeck(oppDeck);
    setOpponentHand(oppDeck);
    setPlayerHand(myDeck);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setBoard(Array(9).fill(null));
    resetQteState();
    setTurn('player');
    setGameOver(false);
    setWinner(null);
    setTieBreakerMsg(null);
    hasRecordedResult.current = false;
  };

  const recommendedPlayerMove = useMemo(() => {
    if (gameState !== 'playing' || gameOver || turn !== 'player' || isAutoBattle || playerHand.length === 0 || isEvaluating || isLowPerformance) return null;
    const multiplier = pendingQteMultiplier ?? 1;
    return findBestMove(board, playerHand, aiStrategy as AiStrategy, 'player', multiplier, elementalBoard as any, undefined, gambitConfig, gambitConfig.activeStance);
  }, [gameState, gameOver, turn, isAutoBattle, playerHand, board, aiStrategy, isEvaluating, elementalBoard, pendingQteMultiplier, isLowPerformance, gambitConfig]);

  const handleCardClick = (idx: number, side: 'player' | 'ai' = 'player') => {
    if (gameOver) return;
    
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Selection sound
    
    if (isShadowMatch) {
       // In shadow match, you can only pick cards from the side whose turn it is
       if (side !== turn) return;
    } else {
       // In normal match, you only pick your own cards
       if (turn !== 'player' || side !== 'player') return;
    }
    
    setSelectedCardIdx(idx === selectedCardIdx && side === selectedCardSide ? null : idx);
    setSelectedCardSide(side);
  };

  const terminateMatgoGame = (pScore: number, aScore: number) => {
    setGameOver(true);
    let winnerSide: 'player' | 'ai' | 'draw' = 'draw';
    if (pScore > aScore) {
      winnerSide = 'player';
    } else if (aScore > pScore) {
      winnerSide = 'ai';
    } else {
      const playerTotalPower = playerDeck.reduce((acc, c) => acc + (c.power || 0), 0);
      const aiTotalPower = opponentDeck.reduce((acc, c) => acc + (c.power || 0), 0);
      if (playerTotalPower > aiTotalPower) {
        winnerSide = 'player';
      } else if (aiTotalPower > playerTotalPower) {
        winnerSide = 'ai';
      } else {
        winnerSide = 'draw';
      }
    }
    setWinner(winnerSide === 'draw' ? null : winnerSide);
    setGameState('gameOver');
    setIsEvaluating(false);
    isProcessingRef.current = false;

    addLog(language === 'ko'
      ? `[ÎßûÍ≥†] Î∞∞ÌãÄ Ï¢ÖÎ£å. ÏµúÏ¢Ö Ï†êÏàò - ÎÇò: ${pScore}Ï†ê vs AI: ${aScore}Ï†ê`
      : `[Matgo] Battle ended. Final Score - Player: ${pScore} pts vs AI: ${aScore} pts`,
      'system'
    );
  };

  const executeMatgoTurn = (cardIdx: number, boardIdx: number, side: 'player' | 'ai') => {
    const hand = side === 'player' ? playerHand : opponentHand;
    const cardToPlace = hand[cardIdx];
    if (!cardToPlace) return;

    setIsEvaluating(true);
    isProcessingRef.current = true;

    const newBoard = [...board];
    const newStacks = { ...matgoBoardStacks };
    const currentStack = newStacks[boardIdx] || [];
    const isPlacedOnEmpty = currentStack.length === 0;

    const playedCard = { ...cardToPlace, owner: side };
    newStacks[boardIdx] = [...currentStack, playedCard];
    newBoard[boardIdx] = playedCard;

    addLog(t('log_deployed', language, {
      owner: side === 'player' ? t('you', language) : t('system_ai', language),
      unit: language === 'ko' ? (cardToPlace.title || cardToPlace.title_en) : (cardToPlace.title_en || cardToPlace.title),
      sector: boardIdx + 1
    }));

    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    if (side === 'player') {
      setPlayerHand(prev => prev.filter((_, i) => i !== cardIdx));
      setSelectedCardIdx(null);
    } else {
      setOpponentHand(prev => prev.filter((_, i) => i !== cardIdx));
    }

    setLastPlacedIdx(boardIdx);
    setBoard(newBoard);
    setMatgoBoardStacks(newStacks);

    if (matgoDeck.length > 0) {
      const middleCard = matgoDeck[0];
      const nextMatgoDeck = matgoDeck.slice(1);
      setMatgoDeck(nextMatgoDeck);
      setMatgoMiddleCard(middleCard);
      setIsShowingMatgoMiddle(true);

      setTimeout(() => {
        setIsShowingMatgoMiddle(false);
        setMatgoMiddleCard(null);

        const middleTribe = getNormalizedElement(middleCard);
        let scoreEarned = 0;

        const updatedStacks = { ...newStacks };
        const updatedBoard = [...newBoard];

        if (isPlacedOnEmpty) {
          let matchIdx = -1;
          for (let i = 0; i < 9; i++) {
            if (i === 4) continue;
            if (updatedBoard[i] && getNormalizedElement(updatedBoard[i]) === middleTribe) {
              matchIdx = i;
              break;
            }
          }

          if (matchIdx !== -1) {
            const matchedCardName = language === 'ko' ? (updatedBoard[matchIdx]?.title || '') : (updatedBoard[matchIdx]?.title_en || '');
            updatedStacks[matchIdx] = [];
            updatedBoard[matchIdx] = null;
            scoreEarned += 1;

            addLog(language === 'ko' 
              ? `[ÎßûÍ≥†] Îí§ÏßëÏùÄ Ïπ¥Îìú(${middleCard.title})Í∞Ä Î≥¥ÎìúÏùò ${matchedCardName}ÏôÄ ÏßùÏù¥ ÎßûÏïÑ 1Ï†êÏùÑ ÌöçÎìùÌñàÏäµÎãàÎã§!`
              : `[Matgo] Flipped ${middleCard.title_en} matched ${matchedCardName} on board, gaining 1 point!`,
              'capture'
            );
          } else {
            const emptyIndices = [];
            for (let i = 0; i < 9; i++) {
              if (i === 4) continue;
              if (!updatedBoard[i]) emptyIndices.push(i);
            }
            if (emptyIndices.length > 0) {
              const randomEmptyIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
              updatedStacks[randomEmptyIdx] = [middleCard];
              updatedBoard[randomEmptyIdx] = middleCard;
            } else {
              addLog(language === 'ko' 
                ? `[ÎßûÍ≥†] Î≥¥ÎìúÍ∞Ä Í∞ÄÎìù Ï∞®ÏÑú Îí§ÏßëÌûå Ïπ¥Îìú(${middleCard.title})Í∞Ä Î≤ÑÎ†§Ï°åÏäµÎãàÎã§.`
                : `[Matgo] Board full, flipped card (${middleCard.title_en}) is discarded.`,
                'system'
              );
            }
          }
        } else {
          const targetStack = updatedStacks[boardIdx];
          const lastPlacedCardTribe = getNormalizedElement(targetStack[targetStack.length - 2]);

          if (lastPlacedCardTribe === middleTribe) {
            updatedStacks[boardIdx] = [...targetStack, middleCard];
            updatedBoard[boardIdx] = middleCard;
            addLog(language === 'ko' 
              ? `[ÎßûÍ≥†] 3Ïû•Ïùò Ï¢ÖÏ°±(${middleCard.title})Ïù¥ Í∞ôÏïÑ Í≤πÏ≥êÏßÑ Ï±ÑÎ°ú Ïú†ÏßÄÎê©ÎãàÎã§. (ÏÑ§ÏÇ¨)`
              : `[Matgo] 3 cards of elements (${middleCard.title_en}) matched! Kept stacked.`,
              'system'
            );
          } else {
            const remainingStack = [...targetStack];
            remainingStack.pop(); 
            remainingStack.pop(); 
            updatedStacks[boardIdx] = remainingStack;
            updatedBoard[boardIdx] = remainingStack.length > 0 ? remainingStack[remainingStack.length - 1] : null;
            scoreEarned += 1;

            addLog(language === 'ko' 
              ? `[ÎßûÍ≥†] Í≤πÏπú Ïπ¥Îìú ÏßùÏù¥ ÎßûÏïÑ 1Ï†êÏùÑ ÌöçÎìùÌñàÏäµÎãàÎã§!`
              : `[Matgo] Stacked cards matched, gaining 1 point!`,
              'capture'
            );

            const emptyIndices = [];
            for (let i = 0; i < 9; i++) {
              if (i === 4) continue;
              if (!updatedBoard[i]) emptyIndices.push(i);
            }
            if (emptyIndices.length > 0) {
              const randomEmptyIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
              updatedStacks[randomEmptyIdx] = [middleCard];
              updatedBoard[randomEmptyIdx] = middleCard;
            } else {
              addLog(language === 'ko' 
                ? `[ÎßûÍ≥†] Î≥¥ÎìúÍ∞Ä Í∞ÄÎìù Ï∞®ÏÑú Îí§ÏßëÌûå Ïπ¥Îìú(${middleCard.title})Í∞Ä Î≤ÑÎ†§Ï°åÏäµÎãàÎã§.`
                : `[Matgo] Board full, flipped card (${middleCard.title_en}) is discarded.`,
                'system'
              );
            }
          }
        }

        setMatgoBoardStacks(updatedStacks);
        setBoard(updatedBoard);
        if (scoreEarned > 0) {
          setMatgoScores(prev => {
            const nextScores = {
              ...prev,
              [side]: prev[side] + scoreEarned
            };
            return nextScores;
          });
        }

        const playerHandEmpty = side === 'player' ? playerHand.length - 1 === 0 : playerHand.length === 0;
        const aiHandEmpty = side === 'ai' ? opponentHand.length - 1 === 0 : opponentHand.length === 0;

        if (playerHandEmpty && aiHandEmpty) {
          const finalPlayerScore = matgoScores.player + (side === 'player' ? scoreEarned : 0);
          const finalAiScore = matgoScores.ai + (side === 'ai' ? scoreEarned : 0);
          terminateMatgoGame(finalPlayerScore, finalAiScore);
        } else {
          setTurn(side === 'player' ? 'ai' : 'player');
          setIsEvaluating(false);
          isProcessingRef.current = false;
        }
      }, 1200 * speedMultiplier);
    } else {
      setIsEvaluating(false);
      isProcessingRef.current = false;
      setTurn(side === 'player' ? 'ai' : 'player');
    }
  };

  const applyPlayerMove = async (cardIdx: number, boardIdx: number) => {
    if (gameOver || (battleType !== 'matgo' && board[boardIdx])) return;
    
    if (battleType === 'matgo') {
      executeMatgoTurn(cardIdx, boardIdx, 'player');
      return;
    }

    const currentHand = playerHand;
    const cardToPlace = currentHand[cardIdx];
    const activeQteMultiplier = pendingQteMultiplier ?? 1;
    const qteBoostApplied = activeQteMultiplier > 1;
    if (!cardToPlace) return;
    
    isProcessingRef.current = true;
    setIsEvaluating(true);

    const newBoard = [...board];
    newBoard[boardIdx] = { ...cardToPlace, owner: 'player' };
    
    // Pattern Tracking Preview
    const { indices: flippedIndicesPreview } = getFlips(newBoard, boardIdx, cardToPlace, 'player', true, activeQteMultiplier);
    setSessionPatterns(prev => ({
      ...prev,
      placements: prev.placements.map((v, i) => i === boardIdx ? v + 1 : v),
      aggressionScore: prev.aggressionScore + (flippedIndicesPreview.length > 0 ? 1 : 0),
      totalMovesTracked: prev.totalMovesTracked + 1
    }));

    addLog(t('log_deployed', language, { 
      owner: t('you', language), 
      unit: language === 'ko' ? (cardToPlace.title || cardToPlace.title_en) : (cardToPlace.title_en || cardToPlace.title), 
      sector: boardIdx + 1 
    }));
    
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Deployment Sound
    
    const newHand = currentHand.filter((_, i) => i !== cardIdx);
    setLastPlacedIdx(boardIdx);
    setPlayerHand(newHand);
    setSelectedCardIdx(null);
    if (qteBoostApplied) {
      setPendingQteMultiplier(null);
    }

    // Item 348: Record manual decision latency
    if (playerTurnStartTime.current) {
      const latency = Date.now() - playerTurnStartTime.current;
      playerTurnLatencies.current.push(latency);
      playerTurnStartTime.current = null;
    }

    // Item 347: Loot Goblin Capture check
    if (goblinTileIndex !== null && !goblinCaptured && (boardIdx === goblinTileIndex || flippedIndicesPreview.includes(goblinTileIndex))) {
      setGoblinCaptured(true);
      setRewardEarned(prev => prev + 25);
      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
      addLog(language === 'ko' 
        ? 'üí∞ [Î≥¥Î¨º Í≥†Î∏îÎ¶∞ Ìè¨Ìöç!] Î≥¥ÎÑàÏä§ +25 SNS ÌÜ†ÌÅ∞ÏùÑ ÌöçÎìùÌñàÏäµÎãàÎã§!' 
        : 'üí∞ [LOOT GOBLIN CAPTURED!] Bonus +25 SNS Tokens earned!', 
        'victory'
      );
    }

    // Item 367: Poison Swamp hazard & Earth Purify mechanic
    if (poisonSwampTileIndex !== null && !poisonSwampCleansed) {
      const isEarthCard = getNormalizedElement(cardToPlace) === 'land' || cardToPlace.element === 'land' || cardToPlace.element === 'earth';
      const rowDiff = Math.abs(Math.floor(boardIdx / 3) - Math.floor(poisonSwampTileIndex / 3));
      const colDiff = Math.abs((boardIdx % 3) - (poisonSwampTileIndex % 3));
      const isAdjacentOrSame = rowDiff <= 1 && colDiff <= 1;

      if (isEarthCard && isAdjacentOrSame) {
        setPoisonSwampCleansed(true);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        addLog(language === 'ko'
          ? `üåø [ÎåÄÏßÄ Ï†ïÌôî (Earth Purify)] ÏßÄÏÜçÏÑ± Ïπ¥ÎìúÏùò Ï†ïÌôîÎ†•ÏúºÎ°ú ${poisonSwampTileIndex + 1}Î≤à Íµ¨Ïó≠Ïùò ÎèÖÍ∏∞Í∞Ä ÎπÑÏò•Ìïú ÎåÄÏßÄÎ°ú Ï†ïÌôîÎêòÏóàÏäµÎãàÎã§! (+1 PWR)`
          : `üåø [EARTH PURIFY] Earth energy cleansed Sector ${poisonSwampTileIndex + 1}! (+1 PWR)`,
          'victory'
        );
      } else if (boardIdx === poisonSwampTileIndex) {
        addLog(language === 'ko'
          ? `‚ò£Ô∏è [ÎèÖÍ∏∞ ÎÖ∏Ï∂ú] ${boardIdx + 1}Î≤à Íµ¨Ïó≠Ïùò ÎèÖÍ∏∞Î°ú Ïù∏Ìï¥ Ïπ¥ÎìúÍ∞Ä Î∂ÄÏãù ÏÉÅÌÉúÏù¥ÏÉÅÏóê Í±∏Î†∏ÏäµÎãàÎã§.`
          : `‚ò£Ô∏è [TOXIC EXPOSURE] Unit placed in Sector ${boardIdx + 1} suffers miasma decay.`,
          'system'
        );
      }
    }

    resolveCombatDelay(newBoard, boardIdx, async (finalBoard, skipTurn) => {
      // Item 368: Track minimum friendly cards during match for clutch comeback bonus
      const friendlyCount = finalBoard.filter(c => c?.owner === 'player').length;
      const totalCount = finalBoard.filter(c => c !== null).length;
      if (totalCount >= 4 && friendlyCount <= 1) {
        minFriendlyCardsCount.current = Math.min(minFriendlyCardsCount.current, friendlyCount);
      }

      // Standalone mode logic
      setBoard(finalBoard);
      setIsEvaluating(false);
      isProcessingRef.current = false;
      setTurn(skipTurn ? 'player' : 'ai');
      if (finalBoard.every(cell => cell !== null)) evaluateGame(finalBoard, 'player');
    }, activeQteMultiplier);
  };

  const handleSkipTurn = async () => {
    if (turn !== 'player' || gameOver || isEvaluating || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    
    // If both are empty, finish the game to abort infinite skipping loop
    if (playerHand.length === 0 && opponentHand.length === 0) {
      isProcessingRef.current = false;
      evaluateGame(board, 'player');
      return;
    }
    
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Changed to interface sound
    
    // Add skip message to chat bubbles
    setBubbles(prev => ({ 
      ...prev, 
      self: { 
        text: t('turn_skipped', language), 
        timestamp: Date.now() 
      } 
    }));

    setTurn('ai');
    setSelectedCardIdx(null);
    isProcessingRef.current = false;
  };

  const handleMouseEnterCell = (idx: number) => {
    setHoveredCellIdx(idx);
    if (turn !== 'player' || gameOver || board[idx] || selectedCardIdx === null) {
      setCapturePreview([]);
      return;
    }
    
    const cardToPlace = playerHand[selectedCardIdx];
    if (!cardToPlace) return;

    const tempBoard = [...board];
    tempBoard[idx] = { ...cardToPlace, owner: 'player' };
    const { indices: flips } = getFlips(tempBoard, idx, cardToPlace, 'player', true, pendingQteMultiplier ?? 1);
    setCapturePreview(flips);
  };

  const handleMouseLeaveCell = () => {
    setHoveredCellIdx(null);
    setCapturePreview([]);
  };

  const handleCellClick = async (droppedIdx: number) => {
    setCapturePreview([]);

    if (activeTrapMode) {
      const targetCard = board[droppedIdx];
      if (activeTrapMode === 'weaken_trap') {
        if (targetCard) {
          showToast(t('toast_select_empty_slot', language));
          return;
        }
        setBoardTraps(prev => ({ ...prev, [droppedIdx]: 'purple' }));
        playSfx('https://assets.mixkit.co/active_storage/sfx/1190/1190-preview.mp3');
        setActiveTrapMode(null);
        return;
      }
      if (activeTrapMode === 'reinforce_trap') {
        if (targetCard) {
          showToast(t('toast_select_empty_slot', language));
          return;
        }
        setBoardTraps(prev => ({ ...prev, [droppedIdx]: 'red' }));
        playSfx('https://assets.mixkit.co/active_storage/sfx/1190/1190-preview.mp3');
        setActiveTrapMode(null);
        return;
      }
      if (activeTrapMode === 'change_opponent') {
        if (!targetCard || targetCard.owner !== 'ai') {
          showToast(t('toast_select_opponent_card', language));
          return;
        }
        const randomCard = {
          ...syncCardWithDatabase(INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)]),
          owner: 'ai' as const
        };
        setBoard(prev => {
          const next = [...prev];
          next[droppedIdx] = randomCard;
          return next;
        });
        playSfx('https://assets.mixkit.co/active_storage/sfx/1190/1190-preview.mp3');
        setActiveTrapMode(null);
        return;
      }
      if (activeTrapMode === 'change_player') {
        if (!targetCard || targetCard.owner !== 'player') {
          showToast(t('toast_select_own_card', language));
          return;
        }
        const randomCard = {
          ...syncCardWithDatabase(INITIAL_CARDS[Math.floor(Math.random() * INITIAL_CARDS.length)]),
          owner: 'player' as const
        };
        setBoard(prev => {
          const next = [...prev];
          next[droppedIdx] = randomCard;
          return next;
        });
        playSfx('https://assets.mixkit.co/active_storage/sfx/1190/1190-preview.mp3');
        setActiveTrapMode(null);
        return;
      }
    }

    if (selectedCardIdx === null || selectedCardSide !== 'player') return;

    if (battleType === 'matgo') {
      if (droppedIdx === 4) {
        showToast(language === 'ko' ? 'Ï§ëÏïô Îç±ÏùÄ ÏÑ†ÌÉùÌï† Ïàò ÏóÜÏäµÎãàÎã§.' : 'Cannot select the middle deck.');
        return;
      }
      const selectedCard = playerHand[selectedCardIdx];
      if (!selectedCard) return;
      const targetCard = board[droppedIdx];
      if (targetCard) {
        const selectedTribe = getNormalizedElement(selectedCard);
        const targetTribe = getNormalizedElement(targetCard);
        if (selectedTribe !== targetTribe) {
          showToast(language === 'ko' ? 'Í∞ôÏùÄ Ï¢ÖÏ°±Ïùò Ïπ¥Îìú ÏúÑÏóêÎßå ÎÜìÏùÑ Ïàò ÏûàÏäµÎãàÎã§.' : 'Can only place on cards of the same elements/races.');
          return;
        }
      }
    }

    await applyPlayerMove(selectedCardIdx, droppedIdx);
  };

  const evaluateGame = (finalBoard: (CardData | null)[], lastPlayer: 'player' | 'ai' = 'player') => {
    setIsEvaluating(true);
    setCheckingIdx(-1);
    hasRecordedRef.current = false;
    
    let currentCheckIdx = 0;

    // Initial delay to let the final move's flip animations play out
    setTimeout(() => {
      const checkInterval = setInterval(() => {
        if (currentCheckIdx < 9) {
          setCheckingIdx(currentCheckIdx);
          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // A ticking sound
          currentCheckIdx++;
        } else {
          clearInterval(checkInterval);
          setCheckingIdx(-1);

          const unplayedCardOwner = lastPlayer === 'player' ? 'ai' : 'player';
          const pScore = finalBoard.filter(c => c?.owner === 'player').length;
          const aScore = finalBoard.filter(c => c?.owner === 'ai').length;

          // Calculate TP for tiebreaker
          const fallbackPPower = playerDeck.reduce((acc, c) => acc + (c.stats?.reduce((a, b) => a + b, 0) || 0), 0);
          const fallbackAPower = opponentDeck.reduce((acc, c) => acc + (c.stats?.reduce((a, b) => a + b, 0) || 0), 0);
          
          let pPower = calculatedTotalPower || fallbackPPower || 1;
          let aPower = (lastOpponent?.type === 'user' ? (lastOpponent as any).totalPower : undefined) || opponentTotalPower || aiSimulatedTotalPower || fallbackAPower || 1;
          
          // NaN protection
          if (isNaN(pPower)) pPower = fallbackPPower || 1;
          if (isNaN(aPower)) aPower = fallbackAPower || 1;

          let finalWinner = 'draw';
          if (pScore >= 6) {
            finalWinner = 'player';
            addLog(t('log_dominant_victory', language, { pScore: pScore, aScore: aScore }), 'victory');
          } else if (aScore >= 6) {
            finalWinner = 'ai';
            addLog(t('log_unit_defeat', language, { pScore: pScore, aScore: aScore }), 'defeat');
          } else {
            // 5:4 cases - Apply Turn Penalty then Tiebreaker
            if (pScore === 5 && aScore === 4 && firstTurn === 'player') {
              // Player had first turn advantage -> TP tiebreaker
              finalWinner = (pPower >= aPower) ? 'player' : 'ai';
              addLog(language === 'ko' ? `TP ÌåêÏ†ï: ${pPower} vs ${aPower}` : `TP Decision: ${pPower} vs ${aPower}`, finalWinner === 'player' ? 'victory' : 'defeat');
            } else if (aScore === 5 && pScore === 4 && firstTurn === 'ai') {
              // AI had first turn advantage -> TP tiebreaker
              finalWinner = (pPower >= aPower) ? 'player' : 'ai';
              addLog(language === 'ko' ? `TP ÌåêÏ†ï: ${pPower} vs ${aPower}` : `TP Decision: ${pPower} vs ${aPower}`, finalWinner === 'player' ? 'victory' : 'defeat');
            } else if (pScore > aScore) {
              finalWinner = 'player';
            } else if (aScore > pScore) {
              finalWinner = 'ai';
            } else {
              // Exact tie in score (e.g. 4.5 vs 4.5? no, but fallback)
              finalWinner = (pPower >= aPower) ? 'player' : 'ai';
              addLog(language === 'ko' ? `TP ÌåêÏ†ï: ${pPower} vs ${aPower}` : `TP Decision: ${pPower} vs ${aPower}`, finalWinner === 'player' ? 'victory' : 'defeat');
            }
          }

          // Important: Update these states BEFORE setGameOver(true) to avoid "Draw" flash/flicker
          setMatchInfo({ playerPower: pPower, opponentPower: aPower });
          setWinner(finalWinner as any);
          setGameOver(true);
          setGameState('gameOver');
          setIsEvaluating(false);
          // Keep auto-battle setting active on game over so that rematch or auto-lobby-restart works seamlessly

          if (battleType === 'pvp_attack') {
            const postId = localStorage.getItem('hero_community_pvp_post_id');
            if (postId) {
              const opponentName = lastOpponent?.name || 'Unknown';
              const resultText = finalWinner === 'player' ? 'ÏäπÎ¶¨' : (finalWinner === 'ai' ? 'Ìå®Î∞∞' : 'Î¨¥ÏäπÎ∂Ä');
              localStorage.setItem('hero_pvp_battle_result', JSON.stringify({
                postId,
                opponentName,
                result: resultText,
                score: `${pScore}-${aScore}`,
                timestamp: Date.now()
              }));
              localStorage.removeItem('hero_community_pvp_post_id');
            }
          }
          

              
              // Calculate actual rewards (with capping and playground check)
              const resultType = finalWinner === 'player' ? 'win' : (finalWinner === 'ai' ? 'loss' : 'draw');
              
              // ÏïïÎèÑÏ†Å ÏäπÎ¶¨ Î∞è 3Î∞∞Ïàò Ïó∞Ïäπ ÌåêÏ†ï (Ïó∞ÏÜçÎåÄÏ†Ñ Ï§ë)
              const isOverwhelming = isAutoBattle && resultType === 'win' && ((pScore === 9 && aScore === 0) || (pScore === 8 && aScore === 1));
              const newWinStreak = (userStats?.winStreak || 0) + 1;
              const isStreakWin = isAutoBattle && resultType === 'win' && newWinStreak > 0 && newWinStreak % 3 === 0;

              setShowOverwhelmingEffect(isOverwhelming);
              setShowStreakEffect(isStreakWin);
              setCurrentWinStreakDisplay(newWinStreak);

              const baseReward = calculateReward(resultType);
              let myFinalReward = baseReward;
              
              if (isAutoBattle && resultType === 'win') {
                const orig = getOriginalBaseReward('win');
                if (isOverwhelming) {
                  myFinalReward += Math.max(1, Math.ceil(orig * 0.2));
                }
                if (isStreakWin) {
                  myFinalReward += Math.max(1, Math.ceil(orig * 0.2));
                }
              }

              // Item 348: Speed Attack bonus (+15% for fast manual play under 5s avg per move)
              const avgPlayerLatency = playerTurnLatencies.current.length > 0 
                ? (playerTurnLatencies.current.reduce((a, b) => a + b, 0) / playerTurnLatencies.current.length) 
                : 99999;
              const isFastPlay = !isAutoBattle && resultType === 'win' && avgPlayerLatency <= 5000;
              if (isFastPlay) {
                setIsSpeedAttackWin(true);
                const speedBonus = Math.max(1, Math.ceil(baseReward * 0.15));
                myFinalReward += speedBonus;
                addLog(language === 'ko' 
                  ? `‚ö° [Ïä§ÌîºÎìú Ïñ¥ÌÉù ÌÅ¥Î¶¨Ïñ¥] ÌèâÍ∑† ${Math.round(avgPlayerLatency / 100) / 10}Ï¥à ÎÇ¥ Ïã†ÏÜçÌïú ÏàòÎèô Í≤∞Ï†ïÏúºÎ°ú Î≥¥ÎÑàÏä§ +15% ÌöçÎìù!` 
                  : `‚ö° [SPEED ATTACK CLEAR] Fast manual moves (${Math.round(avgPlayerLatency / 100) / 10}s avg) granted +15% bonus!`, 
                  'victory'
                );
              }

              // Item 352: Underdog Reversal Bounty (+20% for winning with inferior combat power)
              if (isUnderdogMatch && !isAutoBattle && resultType === 'win') {
                setUnderdogBountyClaimed(true);
                const underdogBonus = Math.max(1, Math.ceil(baseReward * 0.20));
                myFinalReward += underdogBonus;
                addLog(language === 'ko'
                  ? `üèÜ [Ïñ∏ÎçîÎèÖ ÏäπÎ¶¨ Î∞îÏö¥Ìã∞] Ï†ÑÌà¨Î†• Ïó¥ÏÑ∏Î•º Í∑πÎ≥µÌïòÍ≥† ÏäπÎ¶¨ÌïòÏó¨ +20% Ï∂îÍ∞Ä Î≥¥ÏÉÅ ÏßÄÍ∏â!`
                  : `üèÜ [UNDERDOG BOUNTY] Overcame power deficit for +20% bounty reward!`,
                  'victory'
                );
              }

              // Item 355: Mana Spring Claimed Bonus (+10 SNS)
              if (manaSpringClaimed && resultType === 'win') {
                myFinalReward += 10;
                addLog(language === 'ko'
                  ? `üíß [ÎßàÎÇòÏÉò Ï†êÎ†π Î≥¥ÎÑàÏä§] Ï†ÑÏû• ÎßàÎÇòÏÉò ÌôïÎ≥¥Î°ú +10 SNS Ï∂îÍ∞Ä ÏßÄÍ∏â!`
                  : `üíß [MANA SPRING BONUS] Secured Mana Spring for +10 SNS!`,
                  'victory'
                );
              }

              // Item 356: Elemental Master Combo Bonus (+15 SNS)
              if (hasTriggeredElementalCombo && resultType === 'win') {
                myFinalReward += 15;
                addLog(language === 'ko'
                  ? `üî• [ÏóòÎ¶¨Î©òÌÉà ÎßàÏä§ÌÑ∞] 4ÏÜçÏÑ± ÏàúÌôò/ÏõêÏÜå ÏΩ§Î≥¥ Îã¨ÏÑ±ÏúºÎ°ú +15 SNS Ï∂îÍ∞Ä ÏßÄÍ∏â!`
                  : `üî• [ELEMENTAL MASTER] Elemental Synergy Combo achieved for +15 SNS!`,
                  'victory'
                );
              }

              // Item 360: Ironclad Defender Bonus (0 captures suffered, +20 SNS + Rare item fragment)
              if (resultType === 'win' && playerCardsCapturedByAi.current === 0) {
                setIsIroncladWin(true);
                myFinalReward += 20;
                addItem?.('rare');
                addLog(language === 'ko'
                  ? `üõ°Ô∏è [Ï≤†Î≤Ω Î∞©Ïñ¥Ïûê (Ironclad Defender)] Î¨¥ÌîºÍ≤© ÏôÑÎ≤Ω Î∞©Ïñ¥ ÏäπÎ¶¨! ÏÉÅÍ∏â Î£¨ ÌååÌé∏ Î∞è +20 SNS ÌöçÎìù!`
                  : `üõ°Ô∏è [IRONCLAD DEFENDER] Flawless 0-capture defense victory! Rare Rune Fragment +20 SNS earned!`,
                  'victory'
                );
              }

              // Item 364: Legion Commander Bonus (5-card single faction pure deck manual victory)
              const isPureFactionDeck = (playerDeck && playerDeck.length >= 5) && (() => {
                const firstEl = getNormalizedElement(playerDeck[0]);
                return playerDeck.every(c => getNormalizedElement(c) === firstEl);
              })();
              if (resultType === 'win' && !isAutoBattle && isPureFactionDeck) {
                myFinalReward += 25;
                addItem?.('epic');
                addLog(language === 'ko'
                  ? `üéñÔ∏è [Íµ∞Îã® ÏÇ¨Î†πÍ¥Ä (Legion Commander)] ÎèôÏùº ÏÜåÏÜç 5Ïù∏ ÏàúÏàò Îç± ÏàòÎèô ÏôÑÌåå! Ï†ÑÏà† ÎπÑÏ†ÑÏÑú Î∞è +25 SNS ÌöçÎìù!`
                  : `üéñÔ∏è [LEGION COMMANDER] Pure single-faction 5-card manual victory! Tactical Grimoire +25 SNS earned!`,
                  'victory'
                );
              }

              // Item 368: Survival Master Reversal Bonus (1 card left clutch comeback, +30 SNS + Special Chest)
              if (resultType === 'win' && !isAutoBattle && minFriendlyCardsCount.current <= 1) {
                myFinalReward += 30;
                addItem?.('epic');
                addLog(language === 'ko'
                  ? `üî• [ÏÑúÎ∞îÏù¥Î≤å ÎßàÏä§ÌÑ∞ (Survival Master)] ÏïÑÍµ∞ 1Ïû• ÏûîÏó¨ Ï†àÏ≤¥Ï†àÎ™Ö ÏúÑÍ∏∞ ÏàòÎèô ÎåÄÏó≠Ï†ÑÏäπ! ÏÑúÎ∞îÏù¥Î≤å ÏÉÅÏûê Î∞è +30 SNS ÌöçÎìù!`
                  : `üî• [SURVIVAL MASTER] 1-card clutch comeback manual victory! Survival Chest +30 SNS earned!`,
                  'victory'
                );
              }

              // Item 372: Shield Crusher Bounty (3+ shield breaks, +25 SNS + Enchantment Ore)
              if (resultType === 'win' && !isAutoBattle && bossShieldBreaksCount.current >= 3) {
                setIsShieldCrusherWin(true);
                myFinalReward += 25;
                addItem?.('rare');
                addLog(language === 'ko'
                  ? `üõ°Ô∏èüí• [Ïã§Îìú ÌÅ¨Îü¨ÏÖî (Shield Crusher)] Ï†Å Î∞©Ïñ¥Îßâ 3Ìöå ÌååÏáÑ ÏôÑÏäπ! Í∞ïÌôî Í¥ëÏÑù ÏÉÅÏûê Î∞è +25 SNS ÌöçÎìù!`
                  : `üõ°Ô∏èüí• [SHIELD CRUSHER] 3+ barrier breaks victory! Enchantment Ore Crate +25 SNS earned!`,
                  'victory'
                );
              }

              // Item 376: Mirror Master Victory Bounty (Zero elemental advantage bonuses used, 6:3+ decisive win)
              const friendlyWinsCount = finalBoard.filter(c => c?.owner === 'player').length;
              if (resultType === 'win' && !isAutoBattle && elementBonusCountUsed.current === 0 && friendlyWinsCount >= 6) {
                myFinalReward += 25;
                addItem?.('epic');
                addLog(language === 'ko'
                  ? `ü™û [ÎØ∏Îü¨ ÎßàÏä§ÌÑ∞ (Mirror Master)] ÏÉÅÏÑ± Ïö∞ÏúÑ ÏóÜÏù¥ ÏàúÏàò ÏàòÏã∏ÏõÄ 6:3+ ÏôÑÏäπ! Í≥†ÎåÄ Î£¨ Í∞ïÌôîÏ†ú Î∞è +25 SNS ÌöçÎìù!`
                  : `ü™û [MIRROR MASTER] Pure mirror tactical 6:3+ victory with zero elemental bonus! Ancient Rune Enhancer +25 SNS earned!`,
                  'victory'
                );
              }

              // Item 380: Clutch Ace Breaker Trophy (Final 9th-turn 3+ flip clutch comeback)
              if (resultType === 'win' && !isAutoBattle && isClutchAceBreaker.current) {
                myFinalReward += 50;
                addItem?.('legendary');
                addLog(language === 'ko'
                  ? `üëë [ÏóêÏù¥Ïä§ Î∏åÎ†àÏù¥Ïª§ (Clutch Ace Breaker)] 9ÌÑ¥ ÎßàÏßÄÎßâ 1ÌÉÄ 3Ï∫°Ï≤ò ÎåÄÏó≠Ï†ÑÏäπ! Ïã†Ìôî Î£¨ ÏΩîÏñ¥ Î∞è +50 SNS ÌöçÎìù!`
                  : `üëë [CLUTCH ACE BREAKER] Final 9th-turn 3-tile comeback win! Mythic Rune Core +50 SNS earned!`,
                  'victory'
                );
              }

              // Item 382: Total Eclipse Domination (9:0 full board capture)
              if (resultType === 'win' && friendlyWinsCount === 9) {
                setIsTotalEclipseWin(true);
                myFinalReward += 50;
                addItem?.('legendary');
                addLog(language === 'ko'
                  ? `üåë [ÌÜ†ÌÉà Ïù¥ÌÅ¥Î¶ΩÏä§ ÎèÑÎØ∏ÎÑ§Ïù¥ÏÖò] 9:0 Ï†ÑÏû• 100% ÏôÑÏ†Ñ Ïû•ÏïÖ! Ïã†Ìôî Ï†ÑÎ¶¨Ìíà Î∞è +50 SNS ÌöçÎìù!`
                  : `üåë [TOTAL ECLIPSE DOMINATION] 9:0 100% full-board capture victory! Mythic Loot +50 SNS earned!`,
                  'victory'
                );
              }

              // Item 388: Fever Mode 2x Currency Multiplier
              if (isFeverMode && resultType === 'win') {
                myFinalReward = Math.round(myFinalReward * 2);
                addLog(language === 'ko'
                  ? `üî• [ÌîºÎ≤Ñ ÌÉÄÏûÑ Î≥¥ÎÑàÏä§] ÌîºÎ≤Ñ ÏΩ§Î≥¥ Ìö®Í≥ºÎ°ú ÏµúÏ¢Ö Î≥¥ÏÉÅ Ïû¨Ìôî 2Î∞∞(+100%) Ï¶ùÌè≠ Ï†ÅÏö©!`
                  : `üî• [FEVER TIME BONUS] 2x Currency multiplier applied to total battle bounty!`,
                  'victory'
                );
              }

              // Item 384: Manual 5-Win Streak Memory Mini-Game Trigger
              if (resultType === 'win' && !isAutoBattle) {
                manualWinStreak.current += 1;
                if (manualWinStreak.current % 5 === 0) {
                  setTimeout(() => setIsLuckyMatchOpen(true), 1200);
                }
              } else if (resultType === 'loss' && !isAutoBattle) {
                manualWinStreak.current = 0;
              }

              // Item 387: Boss Manual Defeat 3-Chest Unlock Mini-Game Trigger
              if (resultType === 'win' && !isAutoBattle && (battleType === 'boss' || isGuildAttack || isStoryActive)) {
                setTimeout(() => setIsBossChestUnlockOpen(true), 1500);
              }

              // Item 395 & Item 403: Hero Mastery 50-Win Golden Skin & 100-Battle Commander Voice
              const cardIdList = (playerDeck || []).map(c => Number(c.imageIndex ?? c.id)).filter(id => !isNaN(id) && id > 0);
              if (cardIdList.length > 0) {
                const { newlyUnlockedGolden, newlyUnlockedCommander } = recordHeroBattleResult(cardIdList, resultType === 'win');
                if (newlyUnlockedGolden.length > 0) {
                  addLog(`‚ú® [ÏòÅÏõÖ Í≥®Îì† ÎßàÏä§ÌÑ∞Î¶¨ Ìï¥Í∏à] 50Ïäπ Îã¨ÏÑ±ÏúºÎ°ú ÌäπÎ≥Ñ Í≥®Îì† Ïä§ÌÇ®Ïù¥ Í∞úÎ∞©ÎêòÏóàÏäµÎãàÎã§!`, 'victory');
                }
                if (newlyUnlockedCommander.length > 0) {
                  addLog(`üéôÔ∏è [ÏÇ¨Î†πÍ¥Ä ÎßàÏä§ÌÑ∞Î¶¨ Ìï¥Í∏à] 100Ìöå Ï∂úÏ†Ñ Îã¨ÏÑ±ÏúºÎ°ú Ï†ÑÏö© Î≥¥Ïù¥Ïä§ & ÏÇ¨Î†πÍ¥Ä Î∞∞ÏßÄÍ∞Ä Î∂ÄÏó¨ÎêòÏóàÏäµÎãàÎã§!`, 'victory');
                }
              }

              // Item 397: Secret Stamp Real-time Verification
              if (resultType === 'win') {
                // 1. Perimeter Sweep (8 edge tiles occupied by player)
                const perimeterIndices = [0, 1, 2, 3, 5, 6, 7, 8];
                const isPerimeterClean = perimeterIndices.every(idx => finalBoard[idx]?.owner === 'player');
                if (isPerimeterClean) {
                  const stamp = unlockSecretStamp('PERIMETER_SWEEP');
                  if (stamp) addLog(`üìú [ÎπÑÎ∞Ä ÏóÖÏ†Å] [${stamp.titleKo}] Ïô∏Í≥ΩÏÑ† ÏôÑÏ†Ñ Ìè¨ÏúÑ ÏÑ¨Î©∏ Ïä§ÌÉ¨ÌîÑ Îã¨ÏÑ±!`, 'victory');
                }

                // 2. Clutch 1-Point Victory (5:4)
                if (pScore === 5 && aScore === 4) {
                  const stamp = unlockSecretStamp('CLUTCH_ONE_HP');
                  if (stamp) addLog(`üìú [ÎπÑÎ∞Ä ÏóÖÏ†Å] [${stamp.titleKo}] 1Ï†ê Ï∞®Ïù¥ Í∏∞Ï†ÅÏùò Ïó≠Ï†Ñ Ïä§ÌÉ¨ÌîÑ Îã¨ÏÑ±!`, 'victory');
                }

                // 3. Speed Demon (<25s)
                if (Date.now() - battleStartTime <= 25000) {
                  const stamp = unlockSecretStamp('SPEED_DEMON');
                  if (stamp) addLog(`üìú [ÎπÑÎ∞Ä ÏóÖÏ†Å] [${stamp.titleKo}] 25Ï¥à Ïù¥ÎÇ¥ Ï†ÑÍ¥ëÏÑùÌôî ÏäπÎ¶¨ Ïä§ÌÉ¨ÌîÑ Îã¨ÏÑ±!`, 'victory');
                }

                // 4. Mono-Element Purist
                if (isPureFactionDeck) {
                  const stamp = unlockSecretStamp('ELEMENT_PURIST');
                  if (stamp) addLog(`üìú [ÎπÑÎ∞Ä ÏóÖÏ†Å] [${stamp.titleKo}] Îã®Ïùº ÏõêÏÜå ÏàúÌòà ÏäπÎ¶¨ Ïä§ÌÉ¨ÌîÑ Îã¨ÏÑ±!`, 'victory');
                }
              }

              // Item 400: Double Weakness Breaker Crate
              if (hasTriggeredDoubleBreak && resultType === 'win') {
                myFinalReward += 30;
                addItem?.('epic');
                addLog(language === 'ko'
                  ? `üíé [ÎçîÎ∏î Î∏åÎ†àÏù¥Ïª§ ÌÅ¨Î†àÏù¥Ìä∏] Î≥¥Ïä§ 2Ïó∞ÏÜç ÏïΩÏ†ê ÌååÏáÑ ÏÑ±Í≥µÏúºÎ°ú ÏóêÌîΩ ÌÅ¨Î†àÏù¥Ìä∏ Î∞è +30 SNS ÏßÄÍ∏â!`
                  : `üíé [DOUBLE BREAKER CRATE] Double boss weak-point broken! Epic Crate +30 SNS earned!`,
                  'victory'
                );
              }

              // Item 404, Item 408, Item 412: Boss 3-Combo Defeat -> Golden Mini-Games Trigger
              if (resultType === 'win' && !isAutoBattle && (battleType === 'boss' || isGuildAttack) && (lastCombo.count >= 3 || isClutchAceBreaker.current)) {
                const randChoice = Math.random();
                if (randChoice < 0.34) {
                  setTimeout(() => setIsTreasureDartOpen(true), 1800);
                } else if (randChoice < 0.67) {
                  setTimeout(() => setIsPirateRouletteOpen(true), 1800);
                } else {
                  setTimeout(() => setIsArcheryOpen(true), 1800);
                }
              }

              // Item 405: Smart Auto-Disassemble N/R Cards during auto-battles
              if (gambitConfig.autoDisassembleNR && isAutoBattle && resultType === 'win') {
                myFinalReward += 5; // Gold / Powder conversion bonus
                addLog(language === 'ko'
                  ? `‚ôªÔ∏è [ÏûêÎèô Î∂ÑÌï¥ Ïä§ÎßàÌä∏ ÌïÑÌÑ∞] ÌöçÎìùÌïú ÏùºÎ∞ò N/R Ïπ¥ÎìúÍ∞Ä Í≥®Îìú Î∞è Í∞ïÌôî Í∞ÄÎ£®Î°ú Ï¶âÏãú Î∂ÑÌï¥ ÌôòÏ†ÑÎêòÏóàÏäµÎãàÎã§.`
                  : `‚ôªÔ∏è [AUTO-DISASSEMBLE] N/R cards recycled into Gold & Powder automatically.`,
                  'system'
                );
              }

              // Item 409: Smart Rune 4-Set Auto-Equip Notification
              if (isAutoBattle && resultType === 'win') {
                const season = getSeasonItem('hero_current_season', 'season1') || 'season1';
                const runeNoticeKey = `hero_rune_equip_notice_${season}`;
                const lastNoticeTime = parseInt(localStorage.getItem(runeNoticeKey) || '0', 10);
                if (Date.now() - lastNoticeTime > 300000) { // Notify at most once per 5 mins
                  localStorage.setItem(runeNoticeKey, Date.now().toString());
                  addLog(language === 'ko'
                    ? `üõ°Ô∏è [Ïä§ÎßàÌä∏ Î£¨ Ïû•Ï∞©] Ïû•Ï∞© Í∞ÄÎä•Ìïú 4ÏÑ∏Ìä∏ Î£¨Ïù¥ Î∞úÍ≤¨ÎêòÏóàÏäµÎãàÎã§! Îç± ÌôîÎ©¥ÏóêÏÑú ÏõêÌÉ≠ÏúºÎ°ú ÌíÄÏû•Ï∞©ÌïòÏÑ∏Ïöî.`
                    : `üõ°Ô∏è [SMART RUNE NOTICE] 4-set equippable runes ready for quick full equip!`,
                    'system'
                  );
                }
              }

              // Item 411: Speedrun Record (<30s) & Lightning Commander Aura Check
              const battleDurationSec = Math.floor((Date.now() - battleStartTime) / 1000);
              if (resultType === 'win' && battleDurationSec <= 30) {
                const speedrunWins = parseInt(localStorage.getItem('hero_speedrun_fast_wins_v1') || '0', 10) + 1;
                localStorage.setItem('hero_speedrun_fast_wins_v1', speedrunWins.toString());
                if (speedrunWins >= 5) {
                  addLog(language === 'ko'
                    ? `‚ö° [Ï†ÑÍ¥ëÏÑùÌôîÏùò ÏßÄÌúòÍ¥Ä] 30Ï¥à Ïù¥ÎÇ¥ Ïä§ÌîºÎìúÎü∞ 5Ìöå Îã¨ÏÑ±! Ï£ºÍ∞Ñ ÏÉÅÏúÑ 5% Ï†ÑÍ≤© Î≤àÍ∞ú Ïò§ÎùºÍ∞Ä ÌôúÏÑ±ÌôîÎêòÏóàÏäµÎãàÎã§.`
                    : `‚ö° [LIGHTNING COMMANDER] 5 speedrun victories under 30s! Lightning Battle Aura unlocked.`,
                    'victory'
                  );
                }
              }

              // Item 413: Auto-Farm Shard Target Met -> Next Stage Transition
              if (isAutoBattle && resultType === 'win') {
                const currentStageId = 1;
                const stageFarmedCount = parseInt(localStorage.getItem(`hero_farmed_stage_${currentStageId}`) || '0', 10) + 1;
                localStorage.setItem(`hero_farmed_stage_${currentStageId}`, stageFarmedCount.toString());
                if (stageFarmedCount >= 10 && currentStageId < 20) {
                  addLog(language === 'ko'
                    ? `üéØ [Ïä§ÎßàÌä∏ Ï°∞Í∞Å Ï†ÑÌôò] Ïä§ÌÖåÏù¥ÏßÄ ${currentStageId} Î™©Ìëú Ï°∞Í∞Å(10/10) Îã¨ÏÑ±! Îã§Ïùå Ïä§ÌÖåÏù¥ÏßÄ ${currentStageId + 1}Î°ú ÏûêÎèô Ïù¥ÎèôÌï©ÎãàÎã§.`
                    : `üéØ [SMART TARGET SWITCH] Stage ${currentStageId} goal reached! Auto-routing to Stage ${currentStageId + 1}.`,
                    'system'
                  );
                }
              }

              let oppFinalReward = 0;
              const oppCurrentSns = lastOpponent?.sns || 0;
              const myCurrentSns = sns || 0;

              if (battleType === 'pvp_attack') {
                if (resultType === 'win') {
                  const transferAmount = Math.min(oppCurrentSns, myFinalReward);
                  // ÏÉÅÎåÄ SNS Ï†ïÎ≥¥Í∞Ä ÏóÜÍ±∞ÎÇò 0Ïù∏ Îû≠ÌÇπ ÏÉÅÎåÄÎèÑ ÏäπÎ¶¨ Î≥¥ÏÉÅÏùÄ ÏßÄÍ∏âÌïúÎã§.
                  myFinalReward = transferAmount > 0 ? transferAmount : baseReward;
                  oppFinalReward = -transferAmount;
                } else if (resultType === 'loss') {
                  const transferAmount = Math.min(myCurrentSns, Math.abs(baseReward));
                  myFinalReward = -transferAmount;
                  oppFinalReward = transferAmount;
                } else {
                  oppFinalReward = 0;
                }
              } else {
                oppFinalReward = 0;
              }

              if (isPlayground) {
                myFinalReward = 0;
                oppFinalReward = 0;
              }

              if (battleType === 'pvp_attack') {
                if (!hasRecordedRef.current) {
                  hasRecordedRef.current = true;
                  try {
                    const matchRecord = {
                      id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                      userId: 'local-player',
                      player1Id: 'player',
                      player2Id: lastOpponent?.id || 'SYSTEM_BOT',
                      opponentName: lastOpponent?.name || (battleType === 'robot' ? 'AI Hero Bot' : 'Opponent Hero'),
                      result: finalWinner === 'player' ? 'win' : (finalWinner === 'ai' ? 'loss' : 'draw'),
                      winner: finalWinner,
                      timestamp: Date.now(),
                      isAiMatch: true,
                      rewardSns: myFinalReward,
                      snsEarned: myFinalReward,
                      isAutoBattle: isAutoBattle,
                      score: `${pScore}-${aScore}`,
                      myScore: pScore,
                      opponentScore: aScore,
                      deckCardIds: playerDeck.map(c => c.imageIndex ?? 1),
                      opponentCardIds: opponentHand.map(c => c.imageIndex ?? 2),
                      myCards: playerDeck.map(c => ({
                        imageIndex: c.imageIndex ?? 1,
                        title: c.title,
                        title_dis: c.title_dis,
                        title_en: c.title_en,
                        stats: c.stats || [1, 1, 1, 1],
                        level: c.level || 1,
                        rarity: c.rarity || 'common'
                      })),
                      opponentCards: opponentHand.map(c => ({
                        imageIndex: c.imageIndex ?? 2,
                        title: c.title,
                        title_dis: c.title_dis,
                        title_en: c.title_en,
                        stats: c.stats || [1, 1, 1, 1],
                        level: c.level || 1,
                        rarity: c.rarity || 'common'
                      })),
                      mode: battleType === 'pvp_attack' ? 'PVP Rank Match' : battleType === 'robot' ? 'AI Battle' : 'Card Battle'
                    };

                    // Save to LocalStorage Match History
                    const existingHistory = localStorage.getItem('hero_match_history');
                    const history = existingHistory ? JSON.parse(existingHistory) : [];
                    
                    const isDuplicate = history.some((h: any) => 
                      h.player2Id === matchRecord.player2Id && 
                      Math.abs(h.timestamp - matchRecord.timestamp) < 5000
                    );

                    if (!isDuplicate) {
                      const newHistory = [matchRecord, ...history].slice(0, 100);
                      localStorage.setItem('hero_match_history', JSON.stringify(newHistory));
                    }
                    
                    setRewardEarned(myFinalReward);
                  } catch (e) {
                    console.error("Failed to save match record locally:", e);
                  }
                }
              } else if (battleType === 'user' || battleType === 'robot') {
                setRewardEarned(myFinalReward);
              }

              // Patterns extraction
              const result = finalWinner === 'player' ? 'win' : (finalWinner === 'ai' ? 'loss' : 'draw');
              const finalPatterns: Partial<PlayerPatterns> = {
                placements: sessionPatterns.placements,
                aggressionScore: sessionPatterns.totalMovesTracked > 0 
                  ? sessionPatterns.aggressionScore / sessionPatterns.totalMovesTracked 
                  : 0,
                lastTenResults: [result]
              };

              const handleZeroSumAndRecord = (myResult: 'win' | 'loss' | 'draw') => {
                // Battle Result Summary calculations: Damage Dealt & Received
                const calculatedDamage = finalBoard
                  .filter(cell => cell && cell.owner === 'player')
                  .reduce((sum, cell) => {
                    if (!cell) return sum;
                    const statsSum = cell.stats?.reduce((a, b) => a + b, 0) || 0;
                    const bonus = cell.bonusPower || 0;
                    const lvl = cell.level || 1;
                    return sum + statsSum + bonus + (lvl * 15);
                  }, 0) + (myResult === 'win' ? 350 : myResult === 'draw' ? 180 : 90);

                const calculatedDamageReceived = finalBoard
                  .filter(cell => cell && cell.owner === 'ai')
                  .reduce((sum, cell) => {
                    if (!cell) return sum;
                    const statsSum = cell.stats?.reduce((a, b) => a + b, 0) || 0;
                    const bonus = cell.bonusPower || 0;
                    const lvl = cell.level || 1;
                    return sum + statsSum + bonus + (lvl * 15);
                  }, 0) + (myResult === 'loss' ? 350 : myResult === 'draw' ? 180 : 90);

                setTotalDamageDealt(calculatedDamage);
                setTotalDamageReceived(calculatedDamageReceived);

                const xpGained = myResult === 'win' ? 60 : myResult === 'draw' ? 30 : 15;
                const deckToEvaluate = (playerDeck && playerDeck.length > 0) ? playerDeck : INITIAL_CARDS;

                const lvlUpList: LeveledUpCardInfo[] = [];
                const allProgList: LeveledUpCardInfo[] = [];

                deckToEvaluate.forEach((card, idx) => {
                  const oldLevel = card.level || 1;
                  const oldXp = card.xp || card.exp || 0;
                  const nextLevelXp = oldLevel * 100;
                  const totalXp = oldXp + xpGained;
                  const didLevelUp = totalXp >= nextLevelXp || (myResult === 'win' && idx === 0);
                  const newLevel = didLevelUp ? oldLevel + 1 : oldLevel;
                  const currentXp = totalXp % (newLevel * 100);

                  const cardInfo: LeveledUpCardInfo = {
                    card,
                    oldLevel,
                    newLevel,
                    xpGained,
                    currentXp,
                    nextLevelXp: newLevel * 100,
                    statBoost: didLevelUp ? 2 : 0
                  };

                  allProgList.push(cardInfo);
                  if (didLevelUp) {
                    lvlUpList.push(cardInfo);
                  }
                });

                setLeveledUpCards(lvlUpList);
                setAllDeckCardsProgress(allProgList);
                onEarnXp?.(xpGained);

                // Per-card damage and contribution analytics
                const pCells = finalBoard.filter(cell => cell && cell.owner === 'player');
                const aCells = finalBoard.filter(cell => cell && cell.owner === 'ai');
                const pScore = pCells.length;
                const aScore = aCells.length;

                const perfPlayerCards = deckToEvaluate.map((card, idx) => {
                  const onBoard = pCells.filter(c => c && (c.id === card.id || c.title === card.title));
                  const cellDmg = onBoard.reduce((acc, c) => acc + (c ? (c.stats?.reduce((a, b) => a + b, 0) || 0) + (c.bonusPower || 0) + ((c.level || 1) * 15) : 0), 0);
                  const baseDmg = Math.round(calculatedDamage / deckToEvaluate.length) + (idx === 0 ? 50 : 0);
                  const dmgDealt = Math.max(20, cellDmg > 0 ? cellDmg : baseDmg);
                  const dmgRecv = Math.round(calculatedDamageReceived / deckToEvaluate.length);
                  return {
                    card,
                    damageDealt: dmgDealt,
                    damageReceived: dmgRecv,
                    boardPresence: onBoard.length,
                    isMvp: false
                  };
                });
                if (perfPlayerCards.length > 0) {
                  let maxDmgIdx = 0;
                  perfPlayerCards.forEach((c, i) => {
                    if (c.damageDealt > perfPlayerCards[maxDmgIdx].damageDealt) {
                      maxDmgIdx = i;
                    }
                  });
                  perfPlayerCards[maxDmgIdx].isMvp = true;
                }

                // Construct comprehensive post-battle summary data
                const summaryObj: LastBattleSummaryData = {
                  id: `battle_${Date.now()}`,
                  timestamp: Date.now(),
                  battleType,
                  isAutoBattle: Boolean(isAutoBattle),
                  opponent: {
                    id: lastOpponent?.id,
                    name: lastOpponent?.name || 'AI Combat Robot',
                    avatarUrl: lastOpponent?.avatarUrl,
                    totalPower: opponentTotalPower || 350
                  },
                  player: {
                    name: (typeof localStorage !== 'undefined' ? localStorage.getItem('hero_user_name') : null) || 'Hero',
                    totalPower: calculatedTotalPower || 380
                  },
                  result: myResult,
                  boardScore: { player: pScore, ai: aScore },
                  totalDamageDealt: calculatedDamage,
                  totalDamageReceived: calculatedDamageReceived,
                  netDamage: calculatedDamage - calculatedDamageReceived,
                  snsEarned: myFinalReward,
                  xpGained,
                  leveledUpCards: lvlUpList,
                  playerCards: perfPlayerCards,
                  tacticalBonuses: {
                    isSpeedAttack: isSpeedAttackWin,
                    isUnderdog: underdogBountyClaimed,
                    isGoblin: goblinCaptured,
                    isManaSpring: manaSpringClaimed,
                    isElementalCombo: hasTriggeredElementalCombo,
                    isIronclad: isIroncladWin
                  },
                  grade: myResult === 'win' ? (pScore >= 7 ? 'S+' : (pScore >= 6 ? 'S' : 'A')) : (myResult === 'draw' ? 'B' : (aScore <= 5 ? 'C' : 'D'))
                };

                try {
                  localStorage.setItem('hero_last_ai_battle_summary', JSON.stringify(summaryObj));
                } catch {
                  // ignore
                }
                setLastBattleSummaryData(summaryObj);

                // Auto-trigger Battle Summary modal after battle conclusion
                if (!isAutoBattle) {
                  setTimeout(() => {
                    setShowPostBattleSummaryModal(true);
                  }, 800);
                }

                // AI ÎåÄÏ†Ñ(robot)Ïùº ÎïåÎäî ÏÉÅÎåÄÎ∞© AI Ïú†Ï†Ä Ïò§Î∏åÏ†ùÌä∏ Ï†ÑÏ†ÅÏù¥ÎÇò SNSÎ•º Í±¥ÎìúÎ¶¨ÏßÄ ÏïäÏùå
                if (battleType !== 'robot') {
                  setLastOpponent(prev => prev ? {
                    ...prev,
                    wins: (prev.wins || 0) + (myResult === 'loss' ? 1 : 0),
                    losses: (prev.losses || 0) + (myResult === 'win' ? 1 : 0),
                    draws: (prev.draws || 0) + (myResult === 'draw' ? 1 : 0),
                    sns: (prev.sns || 0) + oppFinalReward
                  } : null);
                }

                setIsRecordingResult(true);
                Promise.resolve(recordMatchResult(
                  myResult, 
                  myFinalReward, 
                  finalPatterns, 
                  battleType,
                  lastOpponent ? {
                    id: lastOpponent.id,
                    name: lastOpponent.name,
                    sns: lastOpponent.sns,
                    wins: lastOpponent.wins,
                    losses: lastOpponent.losses,
                    draws: lastOpponent.draws
                  } : undefined
                ))
                  .catch(err => console.error("Error recording match result:", err))
                  .finally(() => {
                    setIsRecordingResult(false);
                  });

                if (battleType === 'pvp_attack') {
                  if ((myCurrentSns + myFinalReward) <= 0 || (oppCurrentSns + oppFinalReward) <= 0) {
                    setHasExhausted(true);
                    setRematchCountdown(null);
                    setShowInsufficientPopup(true);
                  }
                }
              };

              if (finalWinner === 'player') {
                setAutoBattleStats(prev => ({ ...prev, wins: prev.wins + 1 }));
                setWinner('player');
                playSfx('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3'); // Victory
                if (!hasRecordedResult.current) {
                  const finalResult = 'win';
                  const pScore = finalBoard.filter(c => c?.owner === 'player').length;
                  const aScore = finalBoard.filter(c => c?.owner === 'ai').length;
                  
                  handleZeroSumAndRecord(finalResult);

                  // Analytics: Track Game End
                  if (analytics) {
                    logEvent(analytics, 'game_end', {
                      result: finalResult,
                      player_score: pScore,
                      opponent_score: aScore,
                      score_diff: Math.abs(pScore - aScore),
                      ai_difficulty: aiDifficulty
                    });
                  }
                  hasRecordedResult.current = true;
                }
              } else if (finalWinner === 'ai') {
                setAutoBattleStats(prev => ({ ...prev, losses: prev.losses + 1 }));
                setWinner('ai');
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Defeat
                if (!hasRecordedResult.current) {
                  const finalResult = 'loss';
                  const pScore = finalBoard.filter(c => c?.owner === 'player').length;
                  const aScore = finalBoard.filter(c => c?.owner === 'ai').length;

                  handleZeroSumAndRecord(finalResult);

                  // Analytics: Track Game End
                  if (analytics) {
                    logEvent(analytics, 'game_end', {
                      result: finalResult,
                      player_score: pScore,
                      opponent_score: aScore,
                      score_diff: Math.abs(pScore - aScore),
                      ai_difficulty: aiDifficulty
                    });
                  }
                  hasRecordedResult.current = true;
                }
              } else {
                setAutoBattleStats(prev => ({ ...prev, draws: prev.draws + 1 }));
                setWinner('draw');
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                if (!hasRecordedResult.current) {
                  const finalResult = 'draw';
                  const pScore = finalBoard.filter(c => c?.owner === 'player').length;
                  const aScore = finalBoard.filter(c => c?.owner === 'ai').length;

                  handleZeroSumAndRecord(finalResult);

                  // Analytics: Track Game End
                  if (analytics) {
                    logEvent(analytics, 'game_end', {
                      result: finalResult,
                      player_score: pScore,
                      opponent_score: aScore,
                      score_diff: Math.abs(pScore - aScore),
                      ai_difficulty: aiDifficulty
                    });
                  }
                  hasRecordedResult.current = true;
                }
              }
            } // close setInterval branch
          }, 150); // end setInterval
    }, 200); // end setTimeout
  };

  const handleAiTurn = (isPlayerAuto: boolean = false) => {
    if (gameOver) return;
    if (isEvaluating || isProcessingRef.current) return;
    if (isPlayerAuto && !isAutoBattleRef.current) return;
    
    // Analytical sound
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    const side = isPlayerAuto ? 'player' : 'ai';
    const hand = isPlayerAuto ? playerHand : opponentHand;
    
    let strategyToUse: AiStrategy;
    if (isPlayerAuto) {
      strategyToUse = aiStrategy as AiStrategy;
    } else {
      strategyToUse = opponentStrategy;
    }

    if (strategyToUse === 'auto') {
      const pScore = boardScore.player;
      const aScore = boardScore.ai;
      if (isPlayerAuto) {
        if (pScore < aScore) strategyToUse = 'aggressive';
        else if (pScore > aScore + 1) strategyToUse = 'defensive';
        else strategyToUse = 'balanced';
      } else {
        if (aScore < pScore) strategyToUse = 'aggressive';
        else if (aScore > pScore + 1) strategyToUse = 'defensive';
        else strategyToUse = 'balanced';
      }
    }

    setIsEvaluating(true);
    isProcessingRef.current = true;
    if (!isPlayerAuto) setIsAiThinking(true);

    // Initial Analyzing delay - ensure minimum idle window for UI/touch responsiveness
    const initialDelay = lowSpecMode ? 250 : Math.max(350, 550 * speedMultiplier);
    setTimeout(() => {
      // Re-verify cancellation inside async timer
      if (isPlayerAuto && !isAutoBattleRef.current) {
        setIsEvaluating(false);
        isProcessingRef.current = false;
        setIsAiThinking(false);
        return;
      }
      if (gameOver) {
        setIsEvaluating(false);
        isProcessingRef.current = false;
        setIsAiThinking(false);
        return;
      }

      if (battleType === 'matgo') {
        let chosenCardIdx = -1;
        let chosenBoardIdx = -1;
        
        for (let cIdx = 0; cIdx < hand.length; cIdx++) {
          const card = hand[cIdx];
          const tribe = getNormalizedElement(card);
          for (let bIdx = 0; bIdx < 9; bIdx++) {
            if (bIdx === 4) continue;
            if (board[bIdx] && getNormalizedElement(board[bIdx]) === tribe) {
              chosenCardIdx = cIdx;
              chosenBoardIdx = bIdx;
              break;
            }
          }
          if (chosenCardIdx !== -1) break;
        }

        if (chosenCardIdx === -1) {
          const emptyIndices = [];
          for (let i = 0; i < 9; i++) {
            if (i === 4) continue;
            if (!board[i]) emptyIndices.push(i);
          }
          if (emptyIndices.length > 0 && hand.length > 0) {
            chosenCardIdx = Math.floor(Math.random() * hand.length);
            chosenBoardIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          }
        }

        if (chosenCardIdx === -1 || chosenBoardIdx === -1) {
          setIsEvaluating(false);
          isProcessingRef.current = false;
          setIsAiThinking(false);
          if (hand.length > 0) {
            terminateMatgoGame(matgoScores.player, matgoScores.ai);
          } else if (opponentHand.length === 0 && playerHand.length === 0) {
             evaluateGame(board, 'ai');
          } else {
             setTurn(isPlayerAuto ? 'ai' : 'player');
          }
          return;
        }

        setAiReasoning({ text: 'matgo_thinking' as any, cardIdx: chosenCardIdx, boardIdx: chosenBoardIdx, isPlayer: isPlayerAuto });
        
        const matgoApplyDelay = lowSpecMode ? 300 : Math.max(400, 650 * speedMultiplier);
        setTimeout(() => {
          if (isPlayerAuto && !isAutoBattleRef.current) {
            setIsEvaluating(false);
            isProcessingRef.current = false;
            setIsAiThinking(false);
            return;
          }
          isProcessingRef.current = false;
          setIsAiThinking(false);
          if (isPlayerAuto) {
            applyPlayerMove(chosenCardIdx, chosenBoardIdx);
          } else {
            applyAiMove(chosenCardIdx, chosenBoardIdx);
          }
        }, matgoApplyDelay);
        return;
      }

      const multiplier = isPlayerAuto ? (pendingQteMultiplier ?? 1) : 1;
      const effectiveDifficulty = lowSpecMode ? 'easy' : ((aiDifficulty as AiDifficulty) || 'medium');
      let effectiveHand = [...hand];
      if (isPlayerAuto && strategyToUse === 'aggressive') {
        effectiveHand = hand.map(c => ({
          ...c,
          power: (c.power || 0) + 2,
          stats: c.stats.map(s => s + 1) as [number, number, number, number]
        }));
      }
      
      const move = findBestMove(
        board, 
        effectiveHand, 
        strategyToUse, 
        side, 
        multiplier, 
        elementalBoard as any, 
        effectiveDifficulty,
        isPlayerAuto ? gambitConfig : undefined,
        isPlayerAuto ? gambitConfig.activeStance : undefined
      );
      if (!move) {
        setIsEvaluating(false);
        isProcessingRef.current = false;
        setIsAiThinking(false);
        // If both hands are empty, force game over to avoid infinite skipping
        if (opponentHand.length === 0 && playerHand.length === 0) {
           evaluateGame(board, 'ai');
        } else if (opponentHand.length === 0) {
           setTurn(isPlayerAuto ? 'ai' : 'player');
           addLog(t('log_opp_passed', language), 'system');
        } else {
           setTurn(isPlayerAuto ? 'ai' : 'player');
           addLog(t('log_passed', language, { owner: isPlayerAuto ? t('you', language) : t('system_ai', language) }), 'system');
        }
        return;
      }
      
      setAiReasoning({ text: move.reason, cardIdx: move.cardIdx, boardIdx: move.boardIdx, isPlayer: isPlayerAuto });
      if (!isPlayerAuto) addLog(t('log_ai_tactic', language, { reason: t(move.reason as any, language) }), 'system');
      
      const applyDelay = lowSpecMode ? 300 : Math.max(400, 650 * speedMultiplier);
      // Wait a bit more to show the reasoning, then apply
      setTimeout(() => {
        if (isPlayerAuto && !isAutoBattleRef.current) {
          setIsEvaluating(false);
          isProcessingRef.current = false;
          setIsAiThinking(false);
          return;
        }
        isProcessingRef.current = false; // Reset just before apply
        setIsAiThinking(false);
        if (isPlayerAuto) {
          applyPlayerMove(move.cardIdx, move.boardIdx);
        } else {
          applyAiMove(move.cardIdx, move.boardIdx);
        }
      }, applyDelay);
    }, initialDelay);
  };

  // AI Turn Logic (Cards 1-8)
  useEffect(() => {
    if (gameState === 'playing' && turn === 'ai' && !gameOver && !isEvaluating && !activeTrapMode) {
      const isMatgo = battleType === 'matgo';
      const filledCount = board.filter(c => c !== null).length;
      const canPlay = isMatgo ? (opponentHand.length > 0) : (filledCount < 9);
      if (canPlay) {
        const delay = lowSpecMode ? 350 : Math.max(450, 1100 * speedMultiplier);
        const timer = setTimeout(() => {
          handleAiTurn(false);
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, turn, board, gameOver, isEvaluating, battleType, isShadowMatch, opponentHand, activeTrapMode, lowSpecMode, speedMultiplier]);

  // Game Over Safety Net: Monitor board fullness
  useEffect(() => {
    if (gameState === 'playing' && !gameOver && !isEvaluating) {
      const filledCount = board.filter(cell => cell !== null).length;
      if (filledCount === 9) {
        // Only trigger if no one else has triggered evaluation yet
        const timer = setTimeout(() => {
          if (!gameOver && !isEvaluating) {
             addLog(t('log_matrix_capacity', language), 'system');
             evaluateGame(board, turn === 'player' ? 'ai' : 'player');
          }
        }, 500); // Slight delay to ensure UI updates
        return () => clearTimeout(timer);
      }
    }
  }, [board, gameState, gameOver, isEvaluating, turn]);

  // Player Auto-Battle Logic & Auto-Skip
  useEffect(() => {
    if (gameState === 'playing' && turn === 'player' && !gameOver && !isEvaluating && !activeTrapMode) {
      const isMatgo = battleType === 'matgo';
      if (playerHand.length === 0) {
        // Auto skip if player has no cards
        const timer = setTimeout(() => {
           addLog(t('log_player_passed', language), 'system');
           handleSkipTurn();
        }, 800 * speedMultiplier);
        return () => clearTimeout(timer);
      } else if (isAutoBattle) {
        const filledCount = board.filter(c => c !== null).length;
        const canPlay = isMatgo ? (playerHand.length > 0) : (filledCount < 9);
        if (canPlay) {
          const delay = lowSpecMode ? 350 : Math.max(450, 750 * speedMultiplier);
          const timer = setTimeout(() => {
            handleAiTurn(true);
          }, delay);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [gameState, turn, board, gameOver, isEvaluating, isAutoBattle, playerHand, activeTrapMode, battleType, speedMultiplier, lowSpecMode]);

  // Matgo deadlock/full board handler
  useEffect(() => {
    if (gameState === 'playing' && battleType === 'matgo' && !gameOver && !isEvaluating) {
      const currentHand = turn === 'player' ? playerHand : opponentHand;
      
      // 1. Check if there are any empty slots (excluding center index 4)
      let hasEmptySlot = false;
      for (let i = 0; i < 9; i++) {
        if (i === 4) continue;
        if (!board[i]) {
          hasEmptySlot = true;
          break;
        }
      }
      
      // 2. Check if player has any card that elements match with cards on the board (stackable)
      let hasMatchingTribe = false;
      for (const card of currentHand) {
        const tribe = getNormalizedElement(card);
        for (let i = 0; i < 9; i++) {
          if (i === 4) continue;
          if (board[i] && getNormalizedElement(board[i]) === tribe) {
            hasMatchingTribe = true;
            break;
          }
        }
        if (hasMatchingTribe) break;
      }
      
      // If no empty slot, no matching elements, and current player still has cards -> Deadlock
      if (!hasEmptySlot && !hasMatchingTribe && currentHand.length > 0) {
        const timer = setTimeout(() => {
          terminateMatgoGame(matgoScores.player, matgoScores.ai);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState, battleType, board, turn, playerHand, opponentHand, gameOver, isEvaluating, matgoScores]);

  const applyAiMove = (cardIdx: number, boardIdx: number) => {
    if (gameOver || (battleType !== 'matgo' && board[boardIdx]) || isProcessingRef.current) return;
    
    if (battleType === 'matgo') {
      executeMatgoTurn(cardIdx, boardIdx, 'ai');
      return;
    }
    
    isProcessingRef.current = true;
    setAiReasoning(null);
    setIsEvaluating(false);
    
    if (!opponentHand || !opponentHand[cardIdx]) {
      console.warn("AI attempted to play an invalid card.", { opponentHand, cardIdx });
      isProcessingRef.current = false;
      // Fallback turn handling if something goes wrong
      setTurn('player');
      if (board.filter(c => c === null).length === 0) {
        evaluateGame(board, 'ai');
      }
      return;
    }

    const newBoard = [...board];
    const aiCard = { ...opponentHand[cardIdx] };
    newBoard[boardIdx] = aiCard;
    
    addLog(t('log_deployed', language, { 
      owner: t('system_ai', language), 
      unit: language === 'ko' ? (aiCard.title || aiCard.title_en) : (aiCard.title_en || aiCard.title), 
      sector: boardIdx + 1 
    }));
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Deployment Sound
    
    setOpponentHand(prev => prev.filter((_, i) => i !== cardIdx));

    resolveCombatDelay(newBoard, boardIdx, (finalBoard, skipTurn) => {
      // Item 368: Track minimum friendly cards during match for clutch comeback bonus
      const friendlyCount = finalBoard.filter(c => c?.owner === 'player').length;
      const totalCount = finalBoard.filter(c => c !== null).length;
      if (totalCount >= 4 && friendlyCount <= 1) {
        minFriendlyCardsCount.current = Math.min(minFriendlyCardsCount.current, friendlyCount);
      }

      setBoard(finalBoard);
      setTurn(skipTurn ? 'ai' : 'player');
      setSelectedCardIdx(null);
      isProcessingRef.current = false;
      if (finalBoard.every(cell => cell !== null)) evaluateGame(finalBoard, 'ai');
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('hero_mode_play_data');
    if (saved) {
      try {
        setModePlayData(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const recordModePlay = (modeId: string) => {
    const updated = { ...modePlayData };
    if (!updated[modeId]) {
      updated[modeId] = { count: 0, lastPlayed: 0 };
    }
    updated[modeId].count += 1;
    updated[modeId].lastPlayed = Date.now();
    setModePlayData(updated);
    localStorage.setItem('hero_mode_play_data', JSON.stringify(updated));
  };

  const modes = [
    {
      id: 'ai_battle',
      title: t('mode_ai_battle', language),
      icon: Cpu,
      color: 'from-red-500 to-orange-500',
      image: '/minigame_ai_battle.png',
      characterId: 1,
      action: () => {
        setIsDirectAiBattle(true);
        setGameState('lobby');
        
        let activeRobots = chars.filter(c => c.type === 'robot');
        if (activeRobots.length === 0) {
          activeRobots = Array(5).fill(null).map((_, i) => {
            const sector = i % 4;
            const baseX = sector === 1 || sector === 3 ? 60 : 15;
            const baseY = sector >= 2 ? 60 : 15;
            const playerPower = calculatedTotalPower || 1000;
            const powerVariance = 0.7 + Math.random() * 0.6;
            const botTotalPower = Math.max(100, Math.floor(playerPower * powerVariance));
            const snsBase = botTotalPower * (0.5 + Math.random() * 1.5);
            const botSns = Math.max(0, Math.floor(snsBase));
            return {
              id: `bot-${i}`,
              type: 'robot',
              x: baseX + Math.random() * 25,
              y: baseY + Math.random() * 25,
              targetX: Math.random() * 70 + 15,
              targetY: Math.random() * 70 + 15,
              name: generateAiName(`bot-${i}-${Date.now()}`),
              avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Robot-${i}&backgroundColor=dc2626`,
              totalPower: botTotalPower,
              sns: botSns,
              wins: Math.floor(Math.random() * 50),
              losses: Math.floor(Math.random() * 30),
              draws: Math.floor(Math.random() * 10)
            };
          });
          setChars(activeRobots);
        }

        const playerPower = calculatedTotalPower || 1000;
        const bestMatch = findBestMatchingRobot(activeRobots, playerPower, sns || 0) || activeRobots[0];
        
        if (bestMatch) {
          setTimeout(() => {
            handleEncounter(bestMatch);
          }, 50);
        }
      },
      badgeText: 'AI',
      guide: t('mode_ai_battle_guide', language)
    },
    {
      id: 'tournament',
      title: t('mode_tournament', language),
      icon: Trophy,
      color: 'from-yellow-400 to-amber-500',
      image: '/minigame_tournament.png',
      characterId: 2,
      action: () => {
        startTournament();
      },
      badgeText: 'CUP',
      guide: t('mode_tournament_guide', language)
    },

    {
      id: 'boss',
      title: t('mode_boss', language),
      icon: ShieldAlert,
      color: 'from-purple-600 to-rose-600',
      image: '/minigame_boss.png',
      characterId: 3,
      action: () => {
        setIsBossActive(true);
        setGameState('boss');
        saveBossState(true);
      },
      badgeText: 'BOSS',
      guide: t('mode_boss_guide', language)
    },
    {
      id: 'dungeon',
      title: t('mode_dungeon', language),
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-600',
      image: '/minigame_dungeon.png',
      characterId: 4,
      action: () => {
        setIsDungeonActive(true);
        setGameState('dungeon');
        setDungeonPlayerPos({ x: 50, y: 50 });
        setDungeonTargetPos(null);
        saveDungeonState(true, { x: 50, y: 50 });
        
        // ÏßÄÎèÑÎ•º Í±∞ÏπòÏßÄ ÏïäÍ≥† Í≥ßÎ∞îÎ°ú ÏùºÎ∞ò ÎçòÏ†Ñ 5ÎåÄ5 Ïπ¥Îìú Î∞∞ÌãÄ ÏãúÏûë
        const randomCardId = Math.floor(Math.random() * 110) + 1;
        startDungeonBattle(false, randomCardId);
      },
      badgeText: 'DUNGEON',
      guide: t('mode_dungeon_guide', language)
    },
    {
      id: 'defense',
      title: t('mode_defense', language),
      icon: Shield,
      color: 'from-pink-500 to-orange-400',
      image: '/minigame_defense.png',
      characterId: 5,
      action: () => {
        setGameState('defense');
        saveDefenseState(true);
      },
      isNew: true,
      badgeText: 'DEF',
      guide: t('mode_defense_guide', language)
    },
    {
      id: 'snake',
      title: t('mode_snake', language),
      icon: TargetIcon,
      color: 'from-lime-500 to-emerald-600',
      image: '/minigame_snake.png',
      characterId: 6,
      action: () => {
        setGameState('snake');
      },
      isNew: true,
      badgeText: 'SNAKE',
      guide: t('mode_snake_guide', language)
    },
    {
      id: 'shooting',
      title: t('mode_shooting', language),
      icon: Navigation,
      color: 'from-sky-500 to-indigo-600',
      image: '/minigame_shooting.png',
      characterId: 7,
      action: () => {
        setGameState('shooting');
      },
      isNew: true,
      badgeText: 'RAIL',
      guide: t('mode_shooting_guide', language)
    },
    {
      id: 'gomoku',
      title: t('mode_gomoku', language),
      icon: TargetIcon,
      color: 'from-amber-500 to-orange-600',
      image: '/minigame_gomoku.png',
      characterId: 8,
      action: () => {
        setGameState('gomoku');
      },
      isNew: true,
      badgeText: 'OMK',
      guide: t('mode_gomoku_guide', language)
    },
    {
      id: 'memorymatch',
      title: t('mode_memorymatch', language),
      icon: TargetIcon,
      color: 'from-violet-500 to-purple-600',
      image: '/minigame_memorymatch.png',
      characterId: 9,
      action: () => {
        setGameState('memorymatch');
      },
      isNew: true,
      badgeText: 'MEM',
      guide: t('mode_memorymatch_guide', language)
    },
    {
      id: 'slide2048',
      title: t('mode_slide2048', language),
      icon: TargetIcon,
      color: 'from-amber-400 to-orange-500',
      image: '/minigame_slide2048.png',
      characterId: 10,
      action: () => {
        setGameState('slide2048');
      },
      isNew: true,
      badgeText: '2048',
      guide: t('mode_slide2048_guide', language)
    },
    {
      id: 'cardjumper',
      title: t('mode_cardjumper' as any, language),
      icon: TargetIcon,
      color: 'from-blue-500 to-indigo-600',
      image: '/minigame_cardjumper.png',
      characterId: 11,
      action: () => {
        setGameState('cardjumper');
      },
      isNew: true,
      badgeText: 'JUMP',
      guide: t('mode_cardjumper_guide' as any, language)
    },
    {
      id: 'cardtap',
      title: t('mode_cardtap' as any, language),
      icon: Hammer,
      color: 'from-amber-500 to-yellow-500',
      image: '/minigame_cardtap.png',
      characterId: 12,
      action: () => {
        setGameState('cardtap');
      },
      isNew: true,
      badgeText: 'TAP',
      guide: t('mode_cardtap_guide' as any, language)
    },
    {
      id: 'cardflip',
      title: t('mode_cardflip' as any, language),
      icon: Lightbulb,
      color: 'from-indigo-500 to-violet-600',
      image: '/minigame_cardflip.png',
      characterId: 13,
      action: () => {
        setGameState('cardflip');
      },
      isNew: true,
      badgeText: 'FLIP',
      guide: t('mode_cardflip_guide' as any, language)
    },
    {
      id: 'cardslide',
      title: t('mode_cardslide' as any, language),
      icon: Move,
      color: 'from-amber-500 to-yellow-500',
      image: '/minigame_cardslide.png',
      characterId: 14,
      action: () => {
        setGameState('cardslide');
      },
      isNew: true,
      badgeText: 'SLIDE',
      guide: t('mode_cardslide_guide' as any, language)
    },
    {
      id: 'cardsorcery',
      title: t('mode_cardsorcery' as any, language),
      icon: Sparkles,
      color: 'from-indigo-500 to-violet-600',
      image: '/minigame_cardsorcery.png',
      characterId: 15,
      action: () => {
        setGameState('cardsorcery');
      },
      isNew: true,
      badgeText: 'SORCERY',
      guide: t('mode_cardsorcery_guide' as any, language)
    },
    {
      id: 'cardslot',
      title: t('mode_cardslot' as any, language),
      icon: Gem,
      color: 'from-amber-500 to-yellow-500',
      image: '/minigame_cardslot.png',
      characterId: 16,
      action: () => {
        setGameState('cardslot');
      },
      isNew: true,
      badgeText: 'SLOT',
      guide: t('mode_cardslot_guide' as any, language)
    },
    {
      id: 'cardheist',
      title: t('mode_cardheist' as any, language),
      icon: EyeOff,
      color: 'from-indigo-500 to-amber-500',
      image: '/minigame_cardheist.png',
      characterId: 17,
      action: () => {
        setGameState('cardheist');
      },
      isNew: true,
      badgeText: 'HEIST',
      guide: t('mode_cardheist_guide' as any, language)
    },
    {
      id: 'cardrush',
      title: t('mode_cardrush' as any, language),
      icon: Navigation,
      color: 'from-indigo-500 to-amber-400',
      image: '/minigame_cardrush.png',
      characterId: 18,
      action: () => {
        setGameState('cardrush');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'RUSH',
      guide: t('mode_cardrush_guide' as any, language)
    },
    {
      id: 'breakout',
      title: t('mode_breakout', language),
      icon: Hammer,
      color: 'from-orange-500 to-amber-600',
      image: '/minigame_breakout.png',
      characterId: 19,
      action: () => {
        setGameState('breakout');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'BRK',
      guide: t('mode_breakout_guide', language)
    },
    {
      id: 'minesweeper',
      title: t('mode_minesweeper', language),
      icon: Fence,
      color: 'from-red-500 to-rose-600',
      image: '/minigame_minesweeper.png',
      characterId: 20,
      action: () => {
        setGameState('minesweeper');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'MINE',
      guide: t('mode_minesweeper_guide', language)
    },
    {
      id: 'pacman',
      title: t('mode_pacman', language),
      icon: Ghost,
      color: 'from-yellow-400 to-amber-500',
      image: '/minigame_pacman.png',
      characterId: 21,
      action: () => {
        setGameState('pacman');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'PAC',
      guide: t('mode_pacman_guide', language)
    },
    {
      id: 'tictactoe',
      title: t('mode_tictactoe', language),
      icon: Hash,
      color: 'from-emerald-500 to-teal-600',
      image: '/minigame_tictactoe.png',
      characterId: 22,
      action: () => {
        setGameState('tictactoe');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'TIC',
      guide: t('mode_tictactoe_guide', language)
    },
    {
      id: 'trexrunner',
      title: t('mode_trex', language),
      icon: Navigation,
      color: 'from-teal-500 to-cyan-600',
      image: '/minigame_trexrunner.png',
      characterId: 23,
      action: () => {
        setGameState('trexrunner');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'DINO',
      guide: t('mode_trex_guide', language)
    },
    {
      id: 'voxeldefense',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎßàÏù¥Îãù ÎîîÌéúÏä§' : 'Blitz Mining Defense',
      icon: Pickaxe,
      color: 'from-emerald-600 to-teal-700',
      image: '/minigame_defense.png',
      characterId: 24,
      action: () => {
        setGameState('voxeldefense');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'MINING-DEF',
      guide: language === 'ko' ? 'Ïä¨Î°ØÏùÑ ÌÉ≠Ìï¥ Ìè¨ÌÉëÏùÑ Í∞ïÌôîÌïòÍ≥†, Î™¨Ïä§ÌÑ∞Î•º ÏßÅÏ†ë ÌÉ≠Ìï¥ Î≤àÍ∞ú Î≤ºÎùΩÏúºÎ°ú ÏΩîÏñ¥Î•º ÏßÄÌÇ§ÏÑ∏Ïöî.' : 'Tap slots to build turrets and tap monsters to strike holy lightning!'
    },
    {
      id: 'pixelstrike',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌîΩÏÖÄ Ïä§Ìä∏ÎùºÏù¥ÌÅ¨' : 'Blitz Pixel Strike',
      icon: Crosshair,
      color: 'from-rose-600 to-red-700',
      image: '/minigame_shooting.png',
      characterId: 25,
      action: () => {
        setGameState('pixelstrike');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'PIXEL-STRIKE',
      guide: language === 'ko' ? 'Ï†Å ÌÉÄÍπÉÏùÑ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏßÅÏ†ë ÌÉ≠Ìï¥ ÏÇ¨Í≤©ÌïòÍ≥† Ìó§ÎìúÏÉ∑ÏùÑ ÌÑ∞Îú®Î¶¨ÏÑ∏Ïöî.' : 'Tap enemy targets directly to shoot with precision headshots!'
    },
    {
      id: 'voxelparkour',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§Ïπ¥Ïù¥ ÌååÏø†Î•¥' : 'Blitz Sky Parkour',
      icon: Footprints,
      color: 'from-sky-500 to-indigo-600',
      image: '/minigame_cardjumper.png',
      characterId: 26,
      action: () => {
        setGameState('voxelparkour');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'SKY-PARKOUR',
      guide: language === 'ko' ? 'Îã§Ïùå Î∞úÌåêÏùò Î†àÏù∏(Ï¢åÏ∏°/Ï§ëÏïô/Ïö∞Ï∏°)ÏùÑ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏßÅÏ†ë ÌÉ≠ÌïòÏÑ∏Ïöî.' : 'Tap matching platform lane (left/center/right) to jump!'
    },
    {
      id: 'tower_trials',
      title: language === 'ko' ? 'ÏãúÎ†®Ïùò ÌÉë 50Ï∏µ' : 'Tower of Trials',
      icon: Castle,
      color: 'from-amber-600 to-orange-700',
      image: '/minigame_dungeon.png',
      characterId: 27,
      action: () => {
        setIsTowerTrialsOpen(true);
      },
      category: 'battle',
      isNew: true,
      badgeText: 'TOWER',
      guide: language === 'ko' ? '50Ï∏µ Î¨¥Ìïú ÌÉÄÏõåÎ•º Ï†ïÎ≥µÌïòÍ≥† Ï∏µÎ≥Ñ ÎåÄÎüâÏùò SNS Ìè¨Ïù∏Ìä∏ÏôÄ Ìù¨Í∑Ä Î£¨ Î≥¥ÏÉÅÏùÑ ÌöçÎìùÌïòÏÑ∏Ïöî.' : 'Climb 50 floors of trial tower for massive SNS and rare rune rewards!'
    },
    {
      id: 'treasure_dart',
      title: language === 'ko' ? 'Ìô©Í∏à Î≥¥Î¨º Îã§Ìä∏' : 'Treasure Dart',
      icon: TargetIcon,
      color: 'from-yellow-500 to-amber-600',
      image: '/minigame_cardslot.png',
      characterId: 28,
      action: () => {
        setIsTreasureDartOpen(true);
      },
      category: 'casual',
      isNew: true,
      badgeText: 'DART',
      guide: language === 'ko' ? 'Ï†ïÎ∞ÄÌïú ÌÉÄÏù¥Î∞çÏúºÎ°ú ÌöåÏ†ÑÌïòÎäî Ìô©Í∏à Í≥ºÎÖÅÏóê Îã§Ìä∏Î•º ÎçòÏ†∏ Ïû≠Ìåü Î≥¥ÏÉÅÏùÑ ÌöçÎìùÌïòÏÑ∏Ïöî.' : 'Hit the rotating golden bullseye to claim jackpot rewards!'
    },
    {
      id: 'expedition',
      title: language === 'ko' ? '8ÏãúÍ∞Ñ ÏõêÏ†ïÎåÄ' : 'Offline Expedition',
      icon: Compass,
      color: 'from-cyan-600 to-blue-700',
      image: '/minigame_boss.png',
      characterId: 29,
      action: () => {
        setIsExpeditionOpen(true);
      },
      category: 'casual',
      isNew: true,
      badgeText: 'EXP',
      guide: language === 'ko' ? 'ÌûàÏñ¥Î°ú ÌååÌã∞Î•º ÏõêÏ†ïÏóê ÌååÍ≤¨ÌïòÏó¨ Ïò§ÌîÑÎùºÏù∏ ÏÉÅÌÉúÏóêÏÑúÎèÑ ÏûêÎèôÏúºÎ°ú Ï†ÑÎ¶¨ÌíàÏùÑ ÌååÎ∞çÌïòÏÑ∏Ïöî.' : 'Dispatch hero party to automatically farm offline loot for up to 8 hours!'
    },
    {
      id: 'beastarium',
      title: language === 'ko' ? 'Î™¨Ïä§ÌÑ∞ ÎπÑÏä§Ìã∞ÏïÑÎ¶¨ÏõÄ' : 'Monster Beastarium',
      icon: BookOpen,
      color: 'from-purple-600 to-indigo-700',
      image: '/minigame_memorymatch.png',
      characterId: 30,
      action: () => {
        setIsBeastariumOpen(true);
      },
      category: 'casual',
      isNew: true,
      badgeText: 'PET',
      guide: language === 'ko' ? 'Ï†ÑÌà¨ÏóêÏÑú Ï°∞Ïö∞Ìïú Î™¨Ïä§ÌÑ∞Î•º ÎèÑÍ∞êÏóê ÏàòÏßëÌïòÍ≥† Í∑ÄÏó¨Ïö¥ ÎèôÌñâ Ìé´ÏúºÎ°ú Ïú°ÏÑ±ÌïòÏÑ∏Ïöî.' : 'Collect monsters into your beastarium and summon companion pets!'
    },
    {
      id: 'tactician_mastery',
      title: language === 'ko' ? 'Ï†ÑÏà†Í∞Ä ÎßàÏä§ÌÑ∞Î¶¨' : 'Tactician Mastery',
      icon: Sparkles,
      color: 'from-indigo-600 to-purple-800',
      image: '/minigame_cardsorcery.png',
      characterId: 31,
      action: () => {
        setIsTacticianMasteryOpen(true);
      },
      category: 'battle',
      isNew: true,
      badgeText: 'AURA',
      guide: language === 'ko' ? 'Ï†ÑÏà† ÏàôÎ†®ÎèÑÎ•º ÎÜíÏó¨ Ìô©Í∏à/ÎÑ§Ïò®/Î≥¥Ïù¥Îìú Î∞∞ÌãÄ ÏïÑÏö∞Îùº Ïä§ÌÇ®ÏùÑ Ìï¥Í∏àÌïòÍ≥† Îä•Î†•ÏπòÎ•º Í∞ïÌôîÌïòÏÑ∏Ïöî.' : 'Level up tactician mastery to unlock golden and neon battle aura skins!'
    },
    {
      id: 'secret_stamps',
      title: language === 'ko' ? 'ÎπÑÎ∞Ä ÏóÖÏ†Å Ïä§ÌÉ¨ÌîÑ' : 'Secret Stamp Book',
      icon: Award,
      color: 'from-rose-500 to-pink-600',
      image: '/minigame_cardflip.png',
      characterId: 32,
      action: () => {
        setIsSecretStampModalOpen(true);
      },
      category: 'casual',
      isNew: true,
      badgeText: 'STAMP',
      guide: language === 'ko' ? 'Ï†ÑÌà¨ÏôÄ Í≤åÏûÑ Í≥≥Í≥≥Ïóê Ïà®Í≤®ÏßÑ 8Ï¢ÖÏùò ÎπÑÎ∞Ä ÎèÑÏ†ÑÍ≥ºÏ†úÎ•º Îã¨ÏÑ±ÌïòÍ≥† Ïä§ÌÉ¨ÌîÑ Î≥¥ÏÉÅÏùÑ ÏàòÎ†πÌïòÏÑ∏Ïöî.' : 'Uncover 8 hidden secret achievements and collect SNS stamp bounties!'
    },
    {
      id: 'gambit_tuning',
      title: language === 'ko' ? 'AI Í∞¨Îπó Ï†ÑÏà† ÏßÄÏπ®' : 'Gambit Tactics',
      icon: Sliders,
      color: 'from-slate-700 to-slate-900',
      image: '/minigame_ai_battle.png',
      characterId: 33,
      action: () => {
        setIsGambitModalOpen(true);
      },
      category: 'battle',
      isNew: true,
      badgeText: 'AI CFG',
      guide: language === 'ko' ? 'ÏûêÎèô Ï†ÑÌà¨ AIÏùò 3Îã®Í≥Ñ Ï°∞Í±¥Î∂Ä Í∞¨Îπó ÏßÄÏπ®(HP/Î≥¥Ïä§/ÏïΩÏ†ê)ÏùÑ Ïª§Ïä§ÌÖÄ ÌäúÎãùÌïòÏÑ∏Ïöî.' : 'Configure 3-slot conditional gambit tactics for smart auto-battles!'
    },
    {
      id: 'voxelbattlegrounds',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î∂àÎ¶ø Îã∑ÏßÄ' : 'Blitz Bullet Dodge',
      icon: Crosshair,
      color: 'from-blue-600 to-indigo-700',
      image: '/minigame_shooting.png',
      characterId: 34,
      action: () => {
        setGameState('voxelbattlegrounds');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'BULLET-HELL',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÎìúÎûòÍ∑∏Ìï¥ ÏèüÏïÑÏßÄÎäî ÌÉÑÎßâÏùÑ ÏïÑÏä¨ÏïÑÏä¨ÌïòÍ≤å ÌîºÌïòÍ≥† ÎçîÎ∏î ÌÉ≠ Ìå®ÎßÅ Ïã§ÎìúÎ°ú Î∞òÏÇ¨ÌïòÏÑ∏Ïöî.' : 'Drag to dodge bullet hell patterns and double tap to reflect bullets with Parry Shield!'
    },
    {
      id: 'pirate_roulette',
      title: language === 'ko' ? 'Ìô©Í∏à Ìï¥Ï†Å Î£∞Î†õ' : 'Golden Pirate Roulette',
      icon: Swords,
      color: 'from-amber-700 to-yellow-800',
      image: '/minigame_cardslot.png',
      characterId: 35,
      action: () => {
        setIsPirateRouletteOpen(true);
      },
      category: 'casual',
      isNew: true,
      badgeText: 'ROULETTE',
      guide: language === 'ko' ? 'Î≥¥Ïä§ ÏôÑÏäπ ÌõÑ Ìï¥Ï†Å ÌÜµÎÇòÎ¨¥Ïóê ÏπºÏùÑ ÍΩÇÏïÑ Ìè≠Î∞úÏùÑ ÌîºÌï¥ ÎàÑÏ†Å Ïû≠Ìåü ÏÉÅÍ∏àÏùÑ ÌöçÎìùÌïòÏÑ∏Ïöî.' : 'Stab pirate barrels to accumulate massive jackpot SNS rewards!'
    },
    {
      id: 'golden_archery',
      title: language === 'ko' ? 'Ìô©Í∏à ÏñëÍ∂Å ÏÇ¨Í≤©' : 'Golden Archery',
      icon: TargetIcon,
      color: 'from-yellow-600 to-amber-700',
      image: '/minigame_cardjumper.png',
      characterId: 36,
      action: () => {
        setIsArcheryOpen(true);
      },
      category: 'casual',
      isNew: true,
      badgeText: 'ARCHERY',
      guide: language === 'ko' ? 'ÌíçÌñ•Í≥º ÌíçÏÜçÏùÑ Í≥ÑÏÇ∞Ìï¥ 10Ï†ê ÎßåÏ†ê Ìô©Í∏à Í≥ºÎÖÅÏóê 3Î∞úÏùò Ï†ïÎ∞Ä ÌôîÏÇ¥ÏùÑ Î™ÖÏ§ëÏãúÌÇ§ÏÑ∏Ïöî.' : 'Hit the golden 10-ring target with 3 precise wind-calculated arrows!'
    },
    {
      id: 'voxeldungeon',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎçòÏ†Ñ Ïä¨ÎûòÏÖî' : 'Blitz Dungeon Slasher',
      icon: Castle,
      color: 'from-indigo-600 to-purple-700',
      image: '/minigame_dungeon.png',
      characterId: 37,
      action: () => {
        setGameState('voxeldungeon');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'DUNGEON-SLASH',
      guide: language === 'ko' ? 'Î™∞Î†§Ïò§Îäî Î™¨Ïä§ÌÑ∞Î•º ÌÉ≠Ìï¥ Î≤†Ïñ¥ ÎÑòÍ∏∞Í≥† Î≥¥Î¨º ÏÉÅÏûê(üì¶)Î•º Ïó¥Î©∞ 5Ï∏µ ÎçòÏ†ÑÏùÑ Ï†ïÎ≥µÌïòÏÑ∏Ïöî.' : 'Tap monsters directly to slash and collect loot chests to conquer 5 dungeon floors!'
    },
    {
      id: 'voxelspace',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§ÌéòÏù¥Ïä§ Ïò§ÎîîÏÑ∏Ïù¥' : 'Blitz Space Odyssey',
      icon: Compass,
      color: 'from-blue-600 to-cyan-500',
      image: '/minigame_shooting.png',
      characterId: 38,
      action: () => {
        setGameState('voxelspace');
      },
      category: 'shooting',
      isNew: true,
      badgeText: 'SPACE-ODYSSEY',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ï†ÑÌà¨Í∏∞Î•º Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ Ìï¥Ï†Å Ìï®ÏÑ†Í≥º Ïô∏Í≥Ñ Î™®ÏÑ†ÏùÑ ÏöîÍ≤©ÌïòÏÑ∏Ïöî.' : 'Drag starfighter left & right to blast pirate ships and motherships!'
    },
    {
      id: 'voxelzombie',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ï¢ÄÎπÑ ÏÑúÎ∞îÏù¥Î≤å' : 'Blitz Zombie Survival',
      icon: Crosshair,
      color: 'from-emerald-700 to-green-900',
      image: '/minigame_breakout.png',
      characterId: 39,
      action: () => {
        setGameState('voxelzombie');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'ZOMBIE-SURVIVAL',
      guide: language === 'ko' ? 'Ï¢ÄÎπÑÎ•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏßÅÏ†ë ÌÉ≠Ìï¥ Ìó§ÎìúÏÉ∑ÏúºÎ°ú ÏÇ¨Í≤©ÌïòÏÑ∏Ïöî.' : 'Tap zombies directly for instant headshots!'
    },
    {
      id: 'voxelsiege',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏãúÏ¶à Ïä¨ÎßÅ' : 'Blitz Siege Sling',
      icon: Castle,
      color: 'from-amber-700 to-stone-800',
      image: '/minigame_defense.png',
      characterId: 40,
      action: () => {
        setGameState('voxelsiege');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'SIEGE-SLING',
      guide: language === 'ko' ? 'Î∞îÏúÑÎ•º Îí§Î°ú ÎãπÍ≤® Í∂§Ï†ÅÏùÑ Ï°∞Ï§ÄÌïòÍ≥† ÏÜêÏùÑ ÎñºÏñ¥ ÏöîÏÉàÎ•º ÌååÍ¥¥ÌïòÏÑ∏Ïöî.' : 'Pull back on the boulder and release to shatter enemy fortress structures!'
    },
    {
      id: 'voxeltitan',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌÉÄÏù¥ÌÉÑ Î©îÏπ¥' : 'Blitz Titan Mecha',
      icon: Swords,
      color: 'from-rose-600 to-red-800',
      image: '/minigame_boss.png',
      characterId: 41,
      action: () => {
        setGameState('voxeltitan');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'TITAN-MECHA',
      guide: language === 'ko' ? 'Ï†Å Î©îÏπ¥Î•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏßÅÏ†ë ÌÉ≠Ìï¥ ÎØ∏ÏÇ¨ÏùºÏùÑ Î∞úÏÇ¨ÌïòÏÑ∏Ïöî.' : 'Tap enemy mechas to fire guided missiles!'
    },
    {
      id: 'voxeldeepsea',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Îî•Ïî® Îã§Ïù¥Î≤Ñ' : 'Blitz Deep Sea Diver',
      icon: Compass,
      color: 'from-cyan-600 to-blue-800',
      image: '/minigame_shooting.png',
      characterId: 42,
      action: () => {
        setGameState('voxeldeepsea');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'DEEPSEA-DIVE',
      guide: language === 'ko' ? 'Ïû†ÏàòÌï®ÏùÑ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÎìúÎûòÍ∑∏ÌïòÏó¨ ÏÇ∞ÏÜå(ü´ß)ÏôÄ ÌÅ¨Î¶¨Ïä§ÌÉà(üíé)ÏùÑ Ï±ÑÍµ¥ÌïòÍ≥† 300m Ïã¨Ìï¥Ïóê ÎèÑÎã¨ÌïòÏÑ∏Ïöî.' : 'Drag submarine to collect oxygen and crystals while diving toward 300m abyssal trench!'
    },
    {
      id: 'voxelacefighter',
      title: language === 'ko' ? 'ÏÇ¨Ïù¥Î≤Ñ Î¶¨Îì¨ Î∏îÎûòÏä§ÌÑ∞' : 'Cyber Rhythm Blaster',
      icon: Zap,
      color: 'from-pink-600 to-cyan-600',
      image: '/minigame_shooting.png',
      characterId: 43,
      action: () => {
        setGameState('voxelacefighter');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'RHYTHM',
      guide: language === 'ko' ? '4Í∞ú Î†àÏù∏ÏúºÎ°ú Îñ®Ïñ¥ÏßÄÎäî ÎÑ§Ïò® ÎπÑÌä∏ ÎÖ∏Ìä∏Î•º ÌÉÄÏù¥Î∞çÏóê ÎßûÏ∂∞ ÌÑ∞ÏπòÌïòÍ≥† ÏΩ§Î≥¥ ÌîºÎ≤ÑÎ•º Ìè≠Î∞úÏãúÌÇ§ÏÑ∏Ïöî.' : 'Tap neon rhythm beat notes falling in 4 lanes to unleash high-combo fever!'
    },
    {
      id: 'voxeldriftmaster',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä¨ÎßÅ ÎìúÎ¶¨ÌîÑÌä∏' : 'Blitz Sling Drift',
      icon: Zap,
      color: 'from-fuchsia-600 to-indigo-700',
      image: '/minigame_slide2048.png',
      characterId: 44,
      action: () => {
        setGameState('voxeldriftmaster');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'SLING-DRIFT',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ Íæπ ÎàåÎü¨ ÏïµÏª§ ÏΩîÎÑàÎ•º ÌååÏõå ÎìúÎ¶¨ÌîÑÌä∏ÌïòÍ≥†, ÏÜêÏùÑ ÎñºÏñ¥ Î∂ÄÏä§ÌÑ∞ ÏÇ¨Ï∂úÌïòÏÑ∏Ïöî.' : 'Hold screen to sling drift around anchor corners and release to launch forward!'
    },
    {
      id: 'voxelmonsterisle',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î™¨Ïä§ÌÑ∞ ÌÖåÏù¥Î®∏' : 'Blitz Monster Tamer',
      icon: Leaf,
      color: 'from-emerald-600 to-teal-700',
      image: '/minigame_memorymatch.png',
      characterId: 45,
      action: () => {
        setGameState('voxelmonsterisle');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'MONSTER-TAMER',
      guide: language === 'ko' ? 'Î™¨Ïä§ÌÑ∞Î≥ºÏùÑ ÏúÑÎ°ú Ïì∏Ïñ¥Ïò¨Î†§ Îõ∞Ïñ¥Îã§ÎãàÎäî Ìù¨Í∑Ä Î™¨Ïä§ÌÑ∞Î•º Ìè¨ÌöçÌïòÏÑ∏Ïöî.' : 'Swipe up to toss taming balls and capture wild monsters!'
    },
    {
      id: 'voxelcyberninja',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏÑÄÎèÑÏö∞ ÎìÄÏñº' : 'Blitz Shadow Duel',
      icon: Skull,
      color: 'from-slate-800 to-zinc-950',
      image: '/minigame_cardheist.png',
      characterId: 46,
      action: () => {
        setGameState('voxelcyberninja');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'PARRY-DUEL',
      guide: language === 'ko' ? '4Î∞©Ìñ•ÏóêÏÑú ÎèåÏßÑÌï¥Ïò§Îäî Í∑∏Î¶ºÏûê Ï†ÅÏùÑ ÌÉÄÏù¥Î∞çÏóê ÎßûÏ∂∞ Ìï¥Îãπ Î∞©Ìñ• ÌÉ≠ÏúºÎ°ú Ìå®ÎßÅ Î∞òÍ≤©ÌïòÏÑ∏Ïöî.' : 'Tap matching screen quadrants in time to parry incoming shadow attackers!'
    },
    {
      id: 'voxelraftsurvival',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎóèÎ™© ÏÑúÎ∞îÏù¥Î≤å' : 'Blitz Raft Survival',
      icon: Waves,
      color: 'from-blue-500 to-cyan-600',
      image: '/minigame_cardrush.png',
      characterId: 47,
      action: () => {
        setGameState('voxelraftsurvival');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'RAFT-SURVIVAL',
      guide: language === 'ko' ? 'Í∞àÍ≥†Î¶¨Î•º Îí§Î°ú ÎãπÍ≤® ÏûêÏõêÏùÑ ÎÇöÍ≥†, ÏÉÅÏñ¥(ü¶à)Îäî ÏßÅÏ†ë ÌÉ≠Ìï¥ Ìá¥ÏπòÌïòÏÑ∏Ïöî.' : 'Drag hook back to salvage debris, tap sharks to repel!'
    },
    {
      id: 'voxelsnowboard',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§ÎÖ∏Î≥¥Îìú ÏùµÏä§Ìä∏Î¶º' : 'Blitz Snowboard Extreme',
      icon: Mountain,
      color: 'from-sky-500 to-teal-600',
      image: '/minigame_cardjumper.png',
      characterId: 48,
      action: () => {
        setGameState('voxelsnowboard');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'SNOWBOARD-EXTREME',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Î≥¥ÎçîÎ•º Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ Í≤åÏù¥Ìä∏(üö©)Î•º ÌÜµÍ≥ºÌïòÍ≥† ÎÇòÎ¨¥Î•º ÌîºÌïòÏÑ∏Ïöî.' : 'Drag snowboarder left & right to clear gates and dodge trees!'
    },
    {
      id: 'voxelpinball',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎÇòÏù¥Ï∏† Ïä¨ÎßÅ' : 'Blitz Knights Sling',
      icon: Trophy,
      color: 'from-amber-600 to-yellow-600',
      image: '/minigame_cardslot.png',
      characterId: 49,
      action: () => {
        setGameState('voxelpinball');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'KNIGHTS-SLING',
      guide: language === 'ko' ? 'Î∞©Ìå®Î•º Îí§Î°ú ÎãπÍ≤® Í∂§Ï†ÅÏùÑ Ï°∞Ï§ÄÌïòÍ≥† ÏÜêÏùÑ ÎñºÏñ¥ Î∞úÏÇ¨ÌïòÏÑ∏Ïöî.' : 'Drag shield back to aim trajectory and release to fire!'
    },
    {
      id: 'voxelpirate',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌååÏù¥Îüø Ï∫êÎÖº' : 'Blitz Pirate Cannon',
      icon: Swords,
      color: 'from-amber-800 to-red-800',
      image: '/minigame_defense.png',
      characterId: 50,
      action: () => {
        setGameState('voxelpirate');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'PIRATE-CANNON',
      guide: language === 'ko' ? 'Ï†Å Ìï¥Ï†ÅÏÑ†ÏùÑ ÏßÅÏ†ë ÌÉ≠Ìï¥ Ìè¨Í≤©ÌïòÍ≥†, 100% Ïãú ÏïÑÎûòÎ°ú Ïä§ÏôÄÏù¥ÌîÑÌïòÏÑ∏Ïöî.' : 'Tap ships to shoot, swipe down at 100% for full broadside salvo!'
    },
    {
      id: 'voxelovercooked',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏÖ∞ÌîÑ ÌÉÄÏù¥Ïø§' : 'Blitz Chef Tycoon',
      icon: Flame,
      color: 'from-orange-500 to-amber-600',
      image: '/minigame_memorymatch.png',
      characterId: 51,
      action: () => {
        setGameState('voxelovercooked');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'CHEF-TYCOON',
      guide: language === 'ko' ? 'Ï£ºÎ¨∏ÏÑúÏóê ÌïÑÏöîÌïú Ïû¨Î£åÎ•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÌÉ≠ÌïòÏó¨ Ï†ëÏãúÏóê Îã¥ÏúºÏÑ∏Ïöî.' : 'Tap matching ingredients to assemble order on the plate!'
    },
    {
      id: 'voxelprophunt',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌîÑÎ°≠ ÌóåÌÑ∞' : 'Blitz Prop Hunter',
      icon: Ghost,
      color: 'from-purple-600 to-indigo-800',
      image: '/minigame_cardflip.png',
      characterId: 52,
      action: () => {
        setGameState('voxelprophunt');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'PROP-HUNTER',
      guide: language === 'ko' ? 'ÎØ∏ÏÑ∏ÌïòÍ≤å Îì§Ïç©Ïù¥Îäî ÏùòÏã¨Ïä§Îü¨Ïö¥ Í∞ÄÍµ¨Î•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏßÅÏ†ë ÌÉ≠ÌïòÏÑ∏Ïöî.' : 'Tap subtly wiggling suspicious props on your screen!'
    },
    {
      id: 'voxelquantum',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌÄÄÌÖÄ Î£®ÌîÑ' : 'Blitz Quantum Loop',
      icon: Sparkles,
      color: 'from-cyan-500 to-violet-600',
      image: '/minigame_cardsorcery.png',
      characterId: 53,
      action: () => {
        setGameState('voxelquantum');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'QUANTUM-LOOP',
      guide: language === 'ko' ? 'Î∏îÎ£® Ìè¨ÌÉà(üåÄ)ÏóêÏÑú Ïò§Î†åÏßÄ Ìè¨ÌÉà(üü†)ÍπåÏßÄ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ïù¥Ïñ¥ Î£®ÌîÑÎ•º ÏôÑÏÑ±ÌïòÏÑ∏Ïöî.' : 'Drag from blue portal to orange portal across quantum gems to close loop!'
    },
    {
      id: 'voxelrollinghero',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î°§ÎßÅ Î≥º' : 'Blitz Rolling Ball',
      icon: TargetIcon,
      color: 'from-lime-600 to-green-700',
      image: '/minigame_slide2048.png',
      characterId: 54,
      action: () => {
        setGameState('voxelrollinghero');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'ROLLING-BALL',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Î≥ºÏùÑ Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ Ïû•Ïï†Î¨ºÏùÑ ÌîºÌïòÍ≥† Î∂ÄÏä§ÌÑ∞Î•º Î∞üÏúºÏÑ∏Ïöî.' : 'Drag ball left & right to dodge obstacles and hit speed boosters!'
    },
    {
      id: 'voxelsupersmash',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏäàÌçº Ïä§Îß§Ïãú' : 'Blitz Super Smash',
      icon: Swords,
      color: 'from-red-600 to-rose-700',
      image: '/minigame_boss.png',
      characterId: 55,
      action: () => {
        setGameState('voxelsupersmash');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'SUPER-SMASH',
      guide: language === 'ko' ? 'ÌååÏù¥ÌÑ∞Î•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ïû°Í≥† ÎßÅ Î∞ñÏúºÎ°ú Îπ†Î•¥Í≤å Ïì∏Ïñ¥ ÎÑòÍ∏∞ÏÑ∏Ïöî.' : 'Touch fighter and swipe quickly toward the ring edge to knock out!'
    },
    {
      id: 'voxeltowercraft',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌÉÄÏõå ÌÅ¨ÎûòÌîÑÌä∏' : 'Blitz Tower Craft',
      icon: Castle,
      color: 'from-stone-700 to-amber-800',
      image: '/minigame_defense.png',
      characterId: 56,
      action: () => {
        setGameState('voxeltowercraft');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'TOWER-CRAFT',
      guide: language === 'ko' ? 'ÌÉÄÏõå Ïπ¥ÎìúÎ•º ÏÑ†ÌÉùÌï¥ ÌïÑÎìúÏóê Î∞∞ÏπòÌïòÍ≥† Ï†ÅÏùÑ ÌÉ≠Ìï¥ ÏßÅÏ†ë ÏßÄÏõê ÏÇ¨Í≤©ÌïòÏÑ∏Ïöî.' : 'Select tower cards to deploy on field and tap mobs for air strikes!'
    },
    {
      id: 'voxelbeatblaster',
      title: language === 'ko' ? 'ÏïÑÏºÄÏù∏ Ï≤¥Ïù∏ ÎÑòÎ≤Ñ' : 'Arcane Chain Number',
      icon: Zap,
      color: 'from-indigo-600 to-purple-700',
      image: '/minigame_cardtap.png',
      characterId: 57,
      action: () => {
        setGameState('voxelbeatblaster');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'CHAIN-SUM',
      guide: language === 'ko' ? 'ÌôîÎ©¥ ÏúÑ Ïà´Ïûê ÎÖ∏ÎìúÎ•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÎìúÎûòÍ∑∏Ìï¥ ÏÑ†ÏúºÎ°ú Ïó∞Í≤∞ÌïòÏó¨ Î™©Ìëú Ìï©Í≥ÑÎ•º ÏôÑÏÑ±ÌïòÏÑ∏Ïöî.' : 'Drag to connect adjacent number nodes into chains matching the target sum!'
    },
    {
      id: 'voxelcastleblaster',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§Ïπ¥Ïù¥ Ïä§ÌÉù' : 'Blitz Sky Stack',
      icon: Castle,
      color: 'from-amber-700 to-yellow-800',
      image: '/minigame_breakout.png',
      characterId: 58,
      action: () => {
        setGameState('voxelcastleblaster');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'SKY-STACK',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÏõêÌÑ∞Ïπò ÌÉ≠ÌïòÏó¨ ÏõÄÏßÅÏù¥Îäî Î∏îÎ°ùÏùÑ ÏïÑÎûò ÌÉÄÏõåÏóê ÎßûÏ∂∞ ÏåìÍ≥† 20Ï∏µÏùÑ Ï†ïÎ≥µÌïòÏÑ∏Ïöî.' : 'Tap anywhere to stack moving blocks precisely onto the tower and reach floor 20!'
    },
    {
      id: 'voxelfactorycraft',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïπ© Î®∏ÏßÄ' : 'Blitz Chip Merge',
      icon: Sliders,
      color: 'from-teal-600 to-slate-800',
      image: '/minigame_cardslot.png',
      characterId: 59,
      action: () => {
        setGameState('voxelfactorycraft');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'CHIP-MERGE',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÏÉÅ/Ìïò/Ï¢å/Ïö∞Î°ú Ïä§ÏôÄÏù¥ÌîÑÌï¥ Î∞òÎèÑÏ≤¥ Ïπ©ÏùÑ Ï∂©Îèå Ìï©ÏÑ±ÏãúÌÇ§Í≥† Ï¥àÏñëÏûê AI ÏΩîÏñ¥Î•º ÏôÑÏÑ±ÌïòÏÑ∏Ïöî.' : 'Swipe 4 directions to merge matching semiconductor chips into quantum AI processors!'
    },
    {
      id: 'voxelsuperstrikers',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏäàÌçº Ïä§Ìä∏ÎùºÏù¥Ïª§' : 'Blitz Super Striker',
      icon: Trophy,
      color: 'from-emerald-600 to-sky-700',
      image: '/minigame_breakout.png',
      characterId: 60,
      action: () => {
        setGameState('voxelsuperstrikers');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'SUPER-STRIKER',
      guide: language === 'ko' ? 'Ï∂ïÍµ¨Í≥µÏùÑ Í≥®ÎåÄÎ•º Ìñ•Ìï¥ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ïì∏Ïñ¥Ïò¨Î†§ Í∞êÏïÑÏ∞®ÏÑ∏Ïöî.' : 'Swipe soccer ball upward toward the goal to curve shoot!'
    },
    {
      id: 'voxelgladiatorcolosseum',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Í∏ÄÎûòÎîîÏóêÏù¥ÌÑ∞' : 'Blitz Gladiator Duel',
      icon: Swords,
      color: 'from-amber-600 to-red-800',
      image: '/minigame_cardrush.png',
      characterId: 61,
      action: () => {
        setGameState('voxelgladiatorcolosseum');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'GLADIATOR-DUEL',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÌÉ≠Ìï¥ Ïó∞ÏÜç Í≥µÍ≤©ÌïòÍ≥†, Ï†Å Í≥µÍ≤©(‚ö†Ô∏è) Ïãú Ïä§ÏôÄÏù¥ÌîÑÌï¥ Ìå®ÎßÅ Ï≥êÎÇ¥Î©∞ Ï±îÌîºÏñ∏ÏùÑ Ïì∞Îü¨Îú®Î¶¨ÏÑ∏Ïöî.' : 'Tap to attack rapidly and swipe when enemy strikes (‚ö†Ô∏è) to parry and defeat champions!'
    },
    {
      id: 'voxeldragonslayer',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎìúÎûòÍ≥§ Î†àÏù¥Îìú' : 'Blitz Dragon Raid',
      icon: Flame,
      color: 'from-red-600 to-rose-900',
      image: '/minigame_boss.png',
      characterId: 62,
      action: () => {
        setGameState('voxeldragonslayer');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'DRAGON-RAID',
      guide: language === 'ko' ? 'ÎπÑÌñâÌïòÎäî ÎìúÎûòÍ≥§ÏùÑ ÏßÅÏ†ë ÌÉ≠Ìï¥ ÌôîÏÇ¥ÏùÑ ÏèòÍ≥† ÎÇ†ÏïÑÏò§Îäî ÌôîÏóºÌÉÑÏùÑ ÌÉ≠ÏúºÎ°ú ÏöîÍ≤©ÌïòÏÑ∏Ïöî.' : 'Tap flying dragon head directly to shoot & tap incoming fireballs to intercept!'
    },
    {
      id: 'voxelarcherhero',
      title: language === 'ko' ? 'ÏïÑÏºÄÏù∏ Ïä¨ÎßÅÏÉ∑ Í∂ÅÏàò' : 'Arcane Slingshot Archer',
      icon: TargetIcon,
      color: 'from-lime-600 to-emerald-800',
      image: '/minigame_shooting.png',
      characterId: 63,
      action: () => {
        setGameState('voxelarcherhero');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'SLINGSHOT',
      guide: language === 'ko' ? 'ÌôîÎ©¥Ïùò ÌôúÏãúÏúÑÎ•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏßÅÏ†ë ÎãπÍ≤® Í∞ÅÎèÑÎ•º Ï°∞Ï§ÄÌïòÍ≥† ÎÜìÏïÑÏÑú Î™∞Î†§Ïò§Îäî Î™¨Ïä§ÌÑ∞Îì§ÏùÑ Í≤©Ï∂îÌïòÏÑ∏Ïöî.' : 'Drag and release the bowstring to aim and shoot flying monsters in physics archery!'
    },
    {
      id: 'voxelvampiresurvival',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î±ÄÌååÏù¥Ïñ¥ ÏÑúÎ∞îÏù¥Î≤å' : 'Blitz Vampire Survival',
      icon: Skull,
      color: 'from-purple-600 to-indigo-950',
      image: '/minigame_cardsorcery.png',
      characterId: 64,
      action: () => {
        setGameState('voxelvampiresurvival');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'VAMPIRE-SURVIVAL',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÌóåÌÑ∞Î•º ÎìúÎûòÍ∑∏Ìï¥ ÌöåÏ†Ñ Î∏îÎ†àÏù¥ÎìúÎ°ú Ïñ∏Îç∞ÎìúÎ•º ÌÜ†Î≤åÌïòÏÑ∏Ïöî.' : 'Drag hunter to slice approaching undead with orbiting blades!'
    },
    {
      id: 'voxeltankbounce',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌÉ±ÌÅ¨ Î∞îÏö¥Ïä§' : 'Blitz Tank Bounce',
      icon: Crosshair,
      color: 'from-sky-600 to-blue-900',
      image: '/minigame_running.png',
      characterId: 65,
      action: () => {
        setGameState('voxeltankbounce');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'TANK-BOUNCE',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÎìúÎûòÍ∑∏Ìï¥ Í∞ÅÎèÑÎ•º ÎßûÏ∂îÍ≥† ÏÜêÏùÑ ÎñºÏñ¥ ÎèÑÌÉÑ Ìè¨ÌÉÑÏùÑ Î∞úÏÇ¨ÌïòÏÑ∏Ïöî.' : 'Drag to aim ricochet angle and release to fire bouncing shell!'
    },
    {
      id: 'voxelninjaslash',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎãåÏûê Ïä¨ÎûòÏãú' : 'Blitz Ninja Slash',
      icon: Zap,
      color: 'from-pink-600 to-rose-950',
      image: '/minigame_cardslide.png',
      characterId: 66,
      action: () => {
        setGameState('voxelninjaslash');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'NINJA-SLASH',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÌôîÎ©¥ÏùÑ Ïä• Í∑∏Ïñ¥ ÎÇ†ÏïÑÏò§Îäî ÌëúÏ†ÅÎì§ÏùÑ Î≤†Ïñ¥Í∞ÄÎ•¥ÏÑ∏Ïöî.' : 'Swipe screen like a blade to slice flying ninja targets!'
    },
    {
      id: 'voxelgolfmaster',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎØ∏ÎãàÍ≥®ÌîÑ' : 'Blitz Mini Golf',
      icon: Wind,
      color: 'from-emerald-700 to-teal-900',
      image: '/minigame_pinball.png',
      characterId: 67,
      action: () => {
        setGameState('voxelgolfmaster');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'GOLF-SLING',
      guide: language === 'ko' ? 'Í≥®ÌîÑÍ≥µÏùÑ Îí§Î°ú ÎãπÍ≤® ÌååÏõåÎ•º Ï°∞Ï§ÄÌïòÍ≥† ÏÜêÏùÑ ÎñºÏñ¥ ÌôÄÏù∏Ïõê ÌçºÌåÖÏùÑ ÏÑ±Í≥µÏãúÌÇ§ÏÑ∏Ïöî.' : 'Pull back on the golf ball and release to sink a hole-in-one!'
    },
    {
      id: 'voxellumberjacktycoon',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎüºÎ≤ÑÏû≠' : 'Blitz Lumberjack Chop',
      icon: Axe,
      color: 'from-amber-600 to-stone-800',
      image: '/minigame_towercraft.png',
      characterId: 68,
      action: () => {
        setGameState('voxellumberjacktycoon');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'LUMBER-CHOP',
      guide: language === 'ko' ? 'ÌôîÎ©¥ Ï¢åÏö∞Î•º ÌÉ≠Ìï¥ ÎÇòÎ≠áÍ∞ÄÏßÄÎ•º ÌîºÌïòÎ©∞ Îπ†Î•¥Í≤å ÎÇòÎ¨¥Î•º Î≤åÎ™©ÌïòÏÑ∏Ïöî.' : 'Tap left/right to chop wood and dodge falling branches!'
    },
    {
      id: 'voxelfishingmaster',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌîºÏã± Ïä¨ÎßÅ' : 'Blitz Fishing Sling',
      icon: Fish,
      color: 'from-cyan-600 to-blue-900',
      image: '/minigame_cardflip.png',
      characterId: 69,
      action: () => {
        setGameState('voxelfishingmaster');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'FISHING-SLING',
      guide: language === 'ko' ? 'Î¨ºÍ≥†Í∏∞Î•º Ìñ•Ìï¥ ÌÉ≠ÌïòÏó¨ Î∞îÎäòÏùÑ ÎçòÏßÄÍ≥†, Í±∏Î¶¨Î©¥ ÏúÑÎ°ú Ïä§ÏôÄÏù¥ÌîÑ Ï±îÏßàÌïòÏó¨ ÎÇöÏïÑ Ïò¨Î¶¨ÏÑ∏Ïöî.' : 'Tap to cast hook at fishes, swipe up upon bite to catch!'
    },
    {
      id: 'voxelfirerescue',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌååÏù¥Ïñ¥ Î†àÏä§ÌÅê' : 'Blitz Fire Rescue',
      icon: Flame,
      color: 'from-red-600 to-amber-800',
      image: '/minigame_castleblaster.png',
      characterId: 70,
      action: () => {
        setGameState('voxelfirerescue');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'FIRE-RESCUE',
      guide: language === 'ko' ? 'Î∂àÌÉÄÎäî Ï∞ΩÎ¨∏ÏùÑ ÎàåÎü¨ Î¨ºÎåÄÌè¨Î•º ÏßÅÏ†ë Î∂ÑÏÇ¨Ìï¥ ÌôîÏû¨Î•º ÏßÑÏïïÌïòÍ≥† ÌÉàÏ∂ú ÏãúÎØº(üèÉ)ÏùÑ Íµ¨Ï°∞ÌïòÏÑ∏Ïöî.' : 'Hold on burning windows to spray water jets and tap escaping citizens to rescue!'
    },
    {
      id: 'voxelwindhunter',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏúàÎìú ÌóåÌÑ∞' : 'Blitz Wind Hunter',
      icon: TargetIcon,
      color: 'from-emerald-600 to-teal-800',
      image: '/minigame_archerhero.png',
      characterId: 71,
      action: () => {
        setGameState('voxelwindhunter');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'WIND-HUNTER',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ Îí§Î°ú ÎãπÍ≤® Í∞ÅÎèÑÎ•º Ï°∞Ï§ÄÌïòÍ≥† ÏÜêÏùÑ ÎñºÏñ¥ ÌôîÏÇ¥ÏùÑ Î∞úÏÇ¨ÌïòÏÑ∏Ïöî.' : 'Drag backward to aim trajectory and release to shoot!'
    },
    {
      id: 'voxelsubwayrunner',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏÑúÎ∏åÏõ®Ïù¥ Îü¨ÎÑà' : 'Blitz Subway Runner',
      icon: Footprints,
      color: 'from-indigo-600 to-purple-800',
      image: '/minigame_parkour.png',
      characterId: 72,
      action: () => {
        setGameState('voxelsubwayrunner');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'SUBWAY-RUNNER',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ Ï¢åÏö∞/ÏÉÅÌïòÎ°ú Ïä§ÏôÄÏù¥ÌîÑÌï¥ Î†àÏù∏ÏùÑ Î≥ÄÍ≤ΩÌïòÍ≥† Ï†êÌîÑ/Ïä¨ÎùºÏù¥Îî©ÌïòÏÑ∏Ïöî.' : 'Swipe 4 ways for lane switches, jumps, and slides!'
    },
    {
      id: 'voxelcranemaster',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌÉùÎ∞∞ Î∂ÑÎ•ò' : 'Blitz Express Sort',
      icon: Hammer,
      color: 'from-amber-500 to-yellow-800',
      image: '/minigame_factorycraft.png',
      characterId: 73,
      action: () => {
        setGameState('voxelcranemaster');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'EXPRESS-SORT',
      guide: language === 'ko' ? 'Ï§ëÏïô ÌÉùÎ∞∞ ÏÉÅÏûêÏùò ÏÉâÏÉÅÏùÑ ÌôïÏù∏ÌïòÍ≥† Ìï¥Îãπ Î™©Ï†ÅÏßÄ Î∞©Ìñ•(ÏÉÅ/Ìïò/Ï¢å/Ïö∞)ÏúºÎ°ú Îπ†Î•¥Í≤å Ïä§ÏôÄÏù¥ÌîÑÌïòÏÑ∏Ïöî.' : 'Check parcel colors and swipe quickly toward the matching depot direction (Up/Down/Left/Right)!'
    },
    {
      id: 'voxelmonstertruck',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î™¨Ïä§ÌÑ∞ Ìä∏Îü≠' : 'Blitz Monster Truck',
      icon: ShieldAlert,
      color: 'from-orange-600 to-red-900',
      image: '/minigame_tankbounce.png',
      characterId: 74,
      action: () => {
        setGameState('voxelmonstertruck');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'MONSTER-TRUCK',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ìä∏Îü≠ÏùÑ Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ ÌèêÏ∞®Î•º ÏßìÎ∞üÍ≥† Ï†êÌîÑ Îû®ÌîÑÎ•º ÌÉÄÏÑ∏Ïöî.' : 'Drag truck left & right to crush scrap cars and launch off ramps!'
    },
    {
      id: 'voxeltowerstack',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌÉÄÏõå Ïä§ÌÉù' : 'Blitz Tower Stack',
      icon: Castle,
      color: 'from-purple-600 to-pink-800',
      image: '/minigame_towercraft.png',
      characterId: 75,
      action: () => {
        setGameState('voxeltowerstack');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'TOWER-STACK',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÌÉ≠Ìï¥ ÌÉÄÏù¥Î∞çÏóê ÎßûÏ∂∞ Î∏îÎ°ùÏùÑ ÏôÑÎ≤ΩÌïòÍ≤å ÏåìÏúºÏÑ∏Ïöî.' : 'Tap anywhere to drop and stack the moving block!'
    },
    {
      id: 'voxelslamdunk',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä¨Îû®Îç©ÌÅ¨' : 'Blitz Slam Dunk',
      icon: Flame,
      color: 'from-amber-600 to-orange-800',
      image: '/minigame_superstrikers.png',
      characterId: 76,
      action: () => {
        setGameState('voxelslamdunk');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'SLAM-DUNK',
      guide: language === 'ko' ? 'ÎÜçÍµ¨Í≥µÏùÑ Í≥®ÎåÄÎ•º Ìñ•Ìï¥ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Îπ†Î•¥Í≤å Ïì∏Ïñ¥Ïò¨Î†§ ÏäõÏùÑ ÎÑ£ÏúºÏÑ∏Ïöî.' : 'Flick basketball upward toward the moving hoop to score!'
    },
    {
      id: 'voxelcoastertycoon',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïπ¥Ìéò ÌÉÄÏù¥Ïø§' : 'Blitz Cafe Tycoon',
      icon: Wind,
      color: 'from-amber-600 to-orange-800',
      image: '/minigame_drifting.png',
      characterId: 77,
      action: () => {
        setGameState('voxelcoastertycoon');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'CAFE-SERVE',
      guide: language === 'ko' ? 'Î™∞Î†§Ïò§Îäî ÏÜêÎãòÎì§Ïùò Ï£ºÎ¨∏ Î©îÎâ¥Î•º ÌôïÏù∏ÌïòÍ≥† ÌïòÎã® Î≤ÑÌäºÏùÑ ÌÉ≠Ìï¥ Îπ†Î•¥Í≤å ÏÑúÎπôÌïòÏÑ∏Ïöî.' : 'Check customer order bubbles and tap the menu items below to serve them quickly!'
    },
    {
      id: 'voxelsniperhunter',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§ÎÇòÏù¥Ìçº ÌóåÌÑ∞' : 'Blitz Sniper Hunter',
      icon: Crosshair,
      color: 'from-red-600 to-slate-900',
      image: '/minigame_pixelstrike.png',
      characterId: 78,
      action: () => {
        setGameState('voxelsniperhunter');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'SNIPER-HUNTER',
      guide: language === 'ko' ? 'Ï†Å ÏöîÏõêÍ≥º Ìè≠Î∞ú Î∞∞Îü¥(üõ¢Ô∏è)ÏùÑ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏßÅÏ†ë ÌÉ≠Ìï¥ Ï†ÄÍ≤©ÌïòÏÑ∏Ïöî.' : 'Tap enemy agents and explosive barrels directly to snipe!'
    },
    {
      id: 'voxeljetskiwater',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ï†úÌä∏Ïä§ÌÇ§' : 'Blitz Jetski Surf',
      icon: Waves,
      color: 'from-cyan-600 to-blue-800',
      image: '/minigame_deepsea.png',
      characterId: 79,
      action: () => {
        setGameState('voxeljetskiwater');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'JETSKI-SURF',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ Ï¢åÏö∞Î°ú ÎìúÎûòÍ∑∏Ìï¥ Î∂ÄÌëú ÏÇ¨Ïù¥Î•º ÌÜµÍ≥ºÌïòÍ≥† ÌååÎèÑ Ï†êÌîÑÎåÄÏôÄ ÌÑ∞Î≥¥Î°ú ÏßàÏ£ºÌïòÏÑ∏Ïöî.' : 'Drag horizontally to weave through buoys, hit wave ramps and blast turbo!'
    },
    {
      id: 'voxelbaseballderby',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä¨ÎùºÏù¥Ïä§ ÎãåÏûê' : 'Blitz Slice Ninja',
      icon: Swords,
      color: 'from-amber-600 to-red-600',
      image: '/minigame_superstrikers.png',
      characterId: 80,
      action: () => {
        setGameState('voxelbaseballderby');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'SLICE',
      guide: language === 'ko' ? 'ÌôîÎ©¥ ÏúÑÎ°ú ÌäÄÏñ¥Ïò§Î•¥Îäî Í≥ºÏùºÍ≥º Î≥¥ÏÑùÏùÑ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏßÅÏ†ë Ïä• Î≤†Ïñ¥ Í∞ÄÎ•¥Í≥† Ìè≠ÌÉÑÏùÑ ÌîºÌïòÏÑ∏Ïöî.' : 'Swipe across the screen to slice flying fruits and gems with your katana while avoiding bombs!'
    },
    {
      id: 'voxelboxingmighty',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î≥µÏã±' : 'Blitz Boxing Champ',
      icon: Swords,
      color: 'from-red-600 to-orange-700',
      image: '/minigame_boss.png',
      characterId: 81,
      action: () => {
        setGameState('voxelboxingmighty');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'BOXING-CHAMP',
      guide: language === 'ko' ? 'ÌÉ≠ÏúºÎ°ú ÏûΩ, Ïä§ÏôÄÏù¥ÌîÑÎ°ú ÌõÖÍ≥º Ïñ¥ÌçºÏª∑ÏùÑ ÎÇ†Î†§ 3Îã§Ïö¥ KOÎ•º Îã¨ÏÑ±ÌïòÏÑ∏Ïöî.' : 'Tap for jabs, swipe for hooks and uppercuts to score 3-down KO!'
    },
    {
      id: 'voxelmicrokart',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎßàÏù¥ÌÅ¨Î°ú Ïπ¥Ìä∏' : 'Blitz Micro Kart',
      icon: Zap,
      color: 'from-sky-500 to-indigo-600',
      image: '/minigame_drifting.png',
      characterId: 82,
      action: () => {
        setGameState('voxelmicrokart');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'MICRO-KART',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ïπ¥Ìä∏Î•º Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ ÌÑ∞Î≥¥Î•º Î∞üÍ≥† Í≥®Ïù∏ÌïòÏÑ∏Ïöî.' : 'Drag kart left & right to grab turbos and reach the finish line!'
    },
    {
      id: 'voxeltreasuredigger',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ìä∏Î†àÏ†Ä ÎîîÍ±∞' : 'Blitz Treasure Digger',
      icon: Pickaxe,
      color: 'from-amber-700 to-yellow-900',
      image: '/minigame_minesweeper.png',
      characterId: 83,
      action: () => {
        setGameState('voxeltreasuredigger');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'TREASURE-DIGGER',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÎìúÎûòÍ∑∏Ìï¥ Í∞ÅÎèÑÎ•º ÎßûÏ∂îÍ≥† ÏÜêÏùÑ ÎñºÏñ¥ Í∞àÍ≥†Î¶¨Î•º ÏÇ¨Ï∂úÌïòÏÑ∏Ïöî.' : 'Drag to aim hook and release to launch claw!'
    },
    {
      id: 'voxelflightlanding',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌîåÎùºÏù¥Ìä∏ ÎûúÎî©' : 'Blitz Flight Landing',
      icon: Compass,
      color: 'from-blue-600 to-cyan-700',
      image: '/minigame_shooting.png',
      characterId: 84,
      action: () => {
        setGameState('voxelflightlanding');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'FLIGHT-LANDING',
      guide: language === 'ko' ? 'ÎπÑÌñâÍ∏∞Î•º ÌÑ∞ÏπòÌïòÏó¨ ÌïòÎã® ÌôúÏ£ºÎ°ú Î∞è Ìó¨Î¶¨Ìå®ÎìúÎ°ú ÎìúÎûòÍ∑∏Ìï¥ Í≥µÏ§ë Ï∂©Îèå ÏóÜÏù¥ Ï∞©Î•ôÏãúÌÇ§ÏÑ∏Ïöî.' : 'Touch aircraft and drag a path to the runway/helipad to land safely!'
    },
    {
      id: 'voxelgachaclaw',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Í∞ÄÏ±† Î≤ÑÏä§Ìä∏' : 'Blitz Gacha Burst',
      icon: Gift,
      color: 'from-pink-500 to-purple-600',
      image: '/minigame_cardslot.png',
      characterId: 85,
      action: () => {
        setGameState('voxelgachaclaw');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'GACHA-BURST',
      guide: language === 'ko' ? 'ÏèüÏïÑÏßÄÎäî Í∞ÄÏ±† Ï∫°ÏäêÏùÑ Îπ†Î•¥Í≤å ÌÉ≠ÌïòÏó¨ ÌîºÍ∑úÏñ¥Î•º ÌÑ∞Îú®Î¶¨Í≥† Ï†ÑÏÑ§ Ìô©Í∏à Ï∫°Ïäê Ïû≠ÌåüÏùÑ ÎÖ∏Î¶¨ÏÑ∏Ïöî.' : 'Tap falling gacha capsules rapidly to pop figures and hit the legendary jackpot!'
    },
    {
      id: 'voxelbilliardstrick',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ìä∏Î¶≠ Ìè¨ÏºìÎ≥º' : 'Blitz Trick Pocket',
      icon: TargetIcon,
      color: 'from-emerald-600 to-green-800',
      image: '/minigame_pinball.png',
      characterId: 86,
      action: () => {
        setGameState('voxelbilliardstrick');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'POCKET-POOL',
      guide: language === 'ko' ? 'Ìù∞ÏÉâ ÏàòÍµ¨Î•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÎãπÍ≤® Í∞ÅÎèÑÏôÄ ÌååÏõåÎ•º Ï°∞Ï§ÄÌïòÍ≥† ÏÜêÏùÑ ÎñºÏñ¥ Ìè¨ÏºìÎ≥ºÏùÑ ÌôÄÏóê ÎÑ£ÏúºÏÑ∏Ïöî.' : 'Pull back from the cue ball to aim and release to pocket all colored balls!'
    },
    {
      id: 'voxeldartsbar',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌîåÎ¶≠ ÎÇòÏù¥ÌîÑ' : 'Blitz Flick Knife',
      icon: Crosshair,
      color: 'from-amber-600 to-rose-700',
      image: '/minigame_shooting.png',
      characterId: 87,
      action: () => {
        setGameState('voxeldartsbar');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'FLICK-KNIFE',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÏõêÌÑ∞Ïπò ÌÉ≠ÌïòÏó¨ ÌöåÏ†ÑÌïòÎäî ÌÜµÎÇòÎ¨¥Ïóê Îã®Í≤ÄÏùÑ ÍΩÇÏïÑ ÎÑ£Í≥† ÏÇ¨Í≥ºÎ•º Î≤†Ïñ¥ÎÇ¥ÏÑ∏Ïöî.' : 'Tap anywhere to throw knives into the spinning log target and slice apples!'
    },
    {
      id: 'voxelwingsuitskydiving',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏúôÏäàÌä∏' : 'Blitz Wingsuit',
      icon: Wind,
      color: 'from-sky-500 to-indigo-700',
      image: '/minigame_subway.png',
      characterId: 88,
      action: () => {
        setGameState('voxelwingsuitskydiving');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'WINGSUIT',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Îã§Ïù¥Î≤ÑÎ•º ÎìúÎûòÍ∑∏Ìï¥ ÎßÅÏùÑ ÌÜµÍ≥ºÌïòÍ≥† ÏïÑÏù¥ÌÖúÏùÑ ÏàòÏßëÌïòÏÑ∏Ïöî.' : 'Drag wingsuit diver to pass rings and collect items!'
    },
    {
      id: 'voxelbadmintonblitz',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌïëÌêÅ Îû†Î¶¨' : 'Blitz Ping Pong Rally',
      icon: Zap,
      color: 'from-emerald-500 to-teal-700',
      image: '/minigame_tictactoe.png',
      characterId: 89,
      action: () => {
        setGameState('voxelbadmintonblitz');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'PING-PONG',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ Ï¢åÏö∞Î°ú ÏßÅÏ†ë ÎìúÎûòÍ∑∏ÌïòÏó¨ ÌÉÅÍµ¨Í≥µÏùÑ Î∞õÏïÑÏπòÍ≥† Ïä§Îß§ÏãúÎ•º ÎÇ†Î†§ 3Ï†êÏùÑ ÏÑ†Ï∑®ÌïòÏÑ∏Ïöî.' : 'Drag across the screen directly to hit ping pong balls and unleash smashes to score 3 points!'
    },
    {
      id: 'voxelmagnethole',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î∏îÎûôÌôÄ' : 'Blitz Blackhole Sink',
      icon: Gem,
      color: 'from-purple-600 to-pink-600',
      image: '/minigame_cardslot.png',
      characterId: 90,
      action: () => {
        setGameState('voxelmagnethole');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'BLACKHOLE-SINK',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Î∏îÎûôÌôÄÏùÑ ÎìúÎûòÍ∑∏Ìï¥ ÏÜåÌòï ÏÜåÌíàÎ∂ÄÌÑ∞ ÏÇºÌÇ§Í≥† ÎèÑÏãúÎ•º Ìù°ÏûÖÌïòÏÑ∏Ïöî.' : 'Drag blackhole with finger to swallow small objects first and devour the city!'
    },
    {
      id: 'voxelmotocrossstunt',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î™®ÌÜ†ÌÅ¨Î°úÏä§' : 'Blitz Motocross',
      icon: Flame,
      color: 'from-amber-500 to-orange-700',
      image: '/minigame_monstertruck.png',
      characterId: 91,
      action: () => {
        setGameState('voxelmotocrossstunt');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'MOTOCROSS',
      guide: language === 'ko' ? 'ÌôîÎ©¥ ÌôÄÎìúÎ°ú Í∞ÄÏÜçÌïòÍ≥† Í≥µÏ§ëÏóêÏÑú 360¬∞ Î∞±ÌîåÎ¶Ω Ïä§ÌÑ¥Ìä∏Î•º ÏÑ±Í≥µÏãúÌÇ§ÏÑ∏Ïöî.' : 'Hold to accelerate on ground and hold in air for 360¬∞ backflips!'
    },
    {
      id: 'voxelskateboardstreet',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§ÏºÄÏù¥Ìä∏ Ïä§Ìä∏Î¶¨Ìä∏' : 'Blitz Skate Street',
      icon: Sparkles,
      color: 'from-sky-500 to-blue-700',
      image: '/minigame_subway.png',
      characterId: 92,
      action: () => {
        setGameState('voxelskateboardstreet');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'SKATE-STREET',
      guide: language === 'ko' ? 'ÏúÑÎ°ú Ïä§ÏôÄÏù¥ÌîÑÌï¥ Ï†êÌîÑÌïòÍ≥†, Í≥µÏ§ëÏóêÏÑú Ï¢åÏö∞ Ïä§ÏôÄÏù¥ÌîÑÎ°ú 360 ÌÇ•ÌîåÎ¶ΩÏùÑ Íµ¨ÏÇ¨ÌïòÏÑ∏Ïöî.' : 'Swipe up to Ollie jump, swipe left/right in air for 360 kickflip!'
    },
    {
      id: 'voxelsnowboardslalom',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏïåÌååÏù∏ Ïä¨ÎùºÎ°¨' : 'Blitz Alpine Slalom',
      icon: Mountain,
      color: 'from-cyan-500 to-blue-600',
      image: '/minigame_jetski.png',
      characterId: 93,
      action: () => {
        setGameState('voxelsnowboardslalom');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'ALPINE-SLALOM',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÎùºÏù¥ÎçîÎ•º Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ Î†àÎìú(üö©)/Î∏îÎ£®(üî∑) ÍπÉÎ∞úÏùÑ ÌÜµÍ≥ºÌïòÏÑ∏Ïöî.' : 'Drag rider left & right to clear red/blue slalom gates!'
    },
    {
      id: 'voxelkaratebreak',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Í∞ÄÎùºÌÖå Ï∞π' : 'Blitz Karate Chop',
      icon: Trophy,
      color: 'from-rose-600 to-amber-600',
      image: '/minigame_boss.png',
      characterId: 94,
      action: () => {
        setGameState('voxelkaratebreak');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'KARATE-CHOP',
      guide: language === 'ko' ? 'ÏúÑÏóêÏÑú ÏïÑÎûòÎ°ú Îπ†Î•¥Í≤å Ïä§ÏôÄÏù¥ÌîÑÌïòÏó¨ ÏàòÎèÑÎ°ú 10Îã® ÏÜ°ÌåêÍ≥º ÌùëÏöîÏÑù Î∏îÎ°ùÏùÑ Í≤©ÌååÌïòÏÑ∏Ïöî.' : 'Swipe down rapidly to execute a powerful karate chop and shatter blocks!'
    },
    {
      id: 'voxelpinballclimber',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌïÄÎ≥º ÌÅ¥ÎùºÏù¥Î®∏' : 'Blitz Pinball Climber',
      icon: Trophy,
      color: 'from-amber-500 to-rose-500',
      image: '/minigame_boss.png',
      characterId: 95,
      action: () => {
        setGameState('voxelpinballclimber');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'PINBALL-CLIMB',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ìå®Îì§ÏùÑ Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ ÌïÄÎ≥ºÏùÑ ÌäïÍ≤® ÌÉÄÏõåÎ•º Ïò§Î•¥ÏÑ∏Ïöî.' : 'Drag paddle left & right to bounce pinball and climb the tower!'
    },
    {
      id: 'voxelcrazytaxi',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌïòÏù¥Ïõ®Ïù¥ Î†àÏù¥ÏÑú' : 'Blitz Highway Racer',
      icon: Trophy,
      color: 'from-cyan-500 to-blue-700',
      image: '/minigame_boss.png',
      characterId: 96,
      action: () => {
        setGameState('voxelcrazytaxi');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'HIGHWAY-RACE',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ï¢åÏö∞ ÎìúÎûòÍ∑∏ÌïòÏó¨ Ï∞®ÏÑ†ÏùÑ Î≥ÄÍ≤ΩÌïòÍ≥† Ïû•Ïï†Î¨º Ï∞®ÎüâÏùÑ ÏïÑÏä¨ÏïÑÏä¨ÌïòÍ≤å Ï∂îÏõîÌïòÏÑ∏Ïöî.' : 'Drag finger across screen to steer lanes and near-miss traffic at high speed!'
    },
    {
      id: 'voxellaserstealth',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î†àÏù¥Ï†Ä Ïû†ÏûÖ' : 'Blitz Laser Infiltration',
      icon: Trophy,
      color: 'from-rose-500 to-slate-800',
      image: '/minigame_boss.png',
      characterId: 97,
      action: () => {
        setGameState('voxellaserstealth');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'LASER-INFIL',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏöîÏõêÏùÑ ÎìúÎûòÍ∑∏Ìï¥ Î†àÏù¥Ï†ÄÎ•º ÌîºÌï¥ Îã§Ïù¥ÏïÑÎ™¨ÎìúÎ•º ÌÑ∏Í≥† ÌÉàÏ∂úÍµ¨Î°ú Í∞ÄÏÑ∏Ïöî.' : 'Drag agent with finger to dodge lasers, hack diamonds and reach the exit vault!'
    },
    {
      id: 'voxeldojobalance',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§Î™® ÌÉúÌÅ¥' : 'Blitz Sumo Tackle',
      icon: Trophy,
      color: 'from-zinc-700 to-amber-600',
      image: '/minigame_boss.png',
      characterId: 98,
      action: () => {
        setGameState('voxeldojobalance');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'SUMO-TACKLE',
      guide: language === 'ko' ? 'ÌôîÎ©¥ÏùÑ Í¥ëÏÜçÏúºÎ°ú Ïó∞ÌÉÄÌïòÏó¨ ÏÉÅÎåÄÎ•º ÎèÑÌö®(ÎßÅ) Î∞ñÏúºÎ°ú Î∞ÄÏñ¥ÎÇ¥Í≥† 3Ïù∏Ïùò ÎùºÏù¥Î≤åÏùÑ Ï†úÌå®ÌïòÏÑ∏Ïöî.' : 'Tap rapidly anywhere to build push momentum and shove rival fighters out of the dohyo ring!'
    },
    {
      id: 'voxelbubblepop',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î≤ÑÎ∏î Î≤ÑÏä§Ìä∏' : 'Blitz Bubble Burst',
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
      image: '/minigame_boss.png',
      characterId: 99,
      action: () => {
        setGameState('voxelbubblepop');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'BUBBLE-BURST',
      guide: language === 'ko' ? 'ÌôîÎ©¥ ÏúÑ 7x7 Í∑∏Î¶¨ÎìúÏóêÏÑú Í∞ôÏùÄ ÏÉâÏÉÅ Î≤ÑÎ∏î Î≠âÏπòÎ•º ÏßÅÏ†ë ÌÉ≠Ìï¥ Ïó∞ÏáÑ Ìè≠Î∞úÏùÑ ÏùºÏúºÌÇ§ÏÑ∏Ïöî.' : 'Tap matching color bubble clusters on the 7x7 grid to trigger cascading explosive bursts!'
    },
    {
      id: 'voxelwaterslide',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÏõåÌÑ∞ Ïä¨ÎùºÏù¥Îìú' : 'Blitz Water Slide',
      icon: Trophy,
      color: 'from-cyan-400 to-blue-600',
      image: '/minigame_boss.png',
      characterId: 100,
      action: () => {
        setGameState('voxelwaterslide');
      },
      category: 'casual',
      isNew: true,
      badgeText: 'WATER-SLIDE',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÌäúÎ∏åÎ•º Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ Î∂ÄÏä§ÌÑ∞Î•º ÌÉÄÍ≥† ÏïÑÏù¥ÌÖúÏùÑ ÏàòÏßëÌïòÏÑ∏Ïöî.' : 'Drag tube left & right to catch boosters and items!'
    },
    {
      id: 'voxelkrakenhunter',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌÅ¨ÎùºÏºÑ' : 'Blitz Kraken Slayer',
      icon: Trophy,
      color: 'from-sky-600 to-rose-700',
      image: '/minigame_boss.png',
      characterId: 101,
      action: () => {
        setGameState('voxelkrakenhunter');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'KRAKEN-SLAYER',
      guide: language === 'ko' ? 'ÏÜüÍµ¨ÏπòÎäî Ï¥âÏàòÎ•º Ïä§ÏôÄÏù¥ÌîÑÎ°ú ÏûêÎ•¥Í≥†, Í∑∏Î°úÍ∏∞ Ïãú Ï§ëÏïô ÎààÎèôÏûêÎ•º Ïó∞ÌÉÄÌï¥ ÌÅ¨ÎùºÏºÑÏùÑ ÌÜ†Î≤åÌïòÏÑ∏Ïöî.' : 'Swipe to slice tentacles, tap the central eye during groggy to defeat the Kraken!'
    },
    {
      id: 'voxelhalfpipeskater',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌïòÌîÑÌååÏù¥ÌîÑ' : 'Blitz Halfpipe Air',
      icon: Trophy,
      color: 'from-amber-500 to-cyan-500',
      image: '/minigame_boss.png',
      characterId: 102,
      action: () => {
        setGameState('voxelhalfpipeskater');
      },
      category: 'sports',
      isNew: true,
      badgeText: 'HALFPIPE-AIR',
      guide: language === 'ko' ? 'ÏúÑÎ°ú Ïä§ÏôÄÏù¥ÌîÑÌï¥ ÏóêÏñ¥ ÎèÑÏïΩÌïòÍ≥†, Í≥µÏ§ëÏóêÏÑú 4Î∞©Ìñ• Ïä§ÏôÄÏù¥ÌîÑÎ°ú Ìä∏Î¶≠ ÏΩ§Î≥¥Î•º Íµ¨ÏÇ¨ÌïòÏÑ∏Ïöî.' : 'Swipe up to launch and swipe 4-ways to perform radical aerial tricks!'
    },
    {
      id: 'voxelnetherportal',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÎÑ§Îçî Ìè¨ÌÉà' : 'Blitz Nether Portal',
      icon: Trophy,
      color: 'from-purple-900 to-orange-700',
      image: '/minigame_boss.png',
      characterId: 103,
      action: () => {
        setGameState('voxelnetherportal');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'NETHER-PORTAL',
      guide: language === 'ko' ? 'Í∞ôÏùÄ ÏÉâ ÌÅ¨Î¶¨Ïä§ÌÉàÏùÑ 3Í∞ú Ïù¥ÏÉÅ Í∑∏Ïñ¥ Ïó∞Í≤∞Ìï¥ Ìè¨ÌÉàÏùÑ Ïó¨ÏÑ∏Ïöî.' : 'Drag to link 3 or more matching crystals to open the nether portal!'
    },
    {
      id: 'voxelmegaflareassault',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Î©îÍ∞Ä ÌîåÎ†àÏñ¥' : 'Blitz Mega Flare',
      icon: Trophy,
      color: 'from-amber-600 to-red-800',
      image: '/minigame_boss.png',
      characterId: 104,
      action: () => {
        setGameState('voxelmegaflareassault');
      },
      category: 'battle',
      isNew: true,
      badgeText: 'MEGA-FLARE',
      guide: language === 'ko' ? 'Ï†ÅÏùÑ ÏßÅÏ†ë ÌÉ≠Ìï¥ ÏöîÍ≤© ÏÇ¨Í≤©ÌïòÍ≥†, Í≤åÏù¥ÏßÄ 100% Ïãú ÏïÑÎûòÎ°ú Ïä§ÏôÄÏù¥ÌîÑÌï¥ Î©îÍ∞Ä ÌîåÎ†àÏñ¥Î•º Î∞úÎèôÌïòÏÑ∏Ïöî.' : 'Tap enemy ships to shoot plasma, and swipe down at 100% to unleash Mega Flare!'
    },
    {
      id: 'voxelspikerolling',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§ÌååÏù¥ÌÅ¨ Î°§Îü¨' : 'Blitz Spike Roller',
      icon: Trophy,
      color: 'from-orange-700 to-yellow-600',
      image: '/minigame_boss.png',
      characterId: 105,
      action: () => {
        setGameState('voxelspikerolling');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'SPIKE-ROLLER',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú Ïä§ÌååÏù¥ÌÅ¨ Î≥ºÏùÑ Ï¢åÏö∞ ÎìúÎûòÍ∑∏Ìï¥ Í≥®Î†òÍ≥º Î≤ΩÏùÑ Î∂ÑÏáÑ ÌååÍ¥¥ÌïòÏÑ∏Ïöî.' : 'Drag spike boulder left & right to crush golems and walls!'
    },
    {
      id: 'voxelterraquake',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌÖåÎùº ÌÄòÏù¥ÌÅ¨' : 'Blitz Terra Quake',
      icon: Trophy,
      color: 'from-lime-800 to-emerald-900',
      image: '/minigame_boss.png',
      characterId: 106,
      action: () => {
        setGameState('voxelterraquake');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'TERRA-QUAKE',
      guide: language === 'ko' ? 'ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÏÉùÏ°¥ÏûêÎ•º ÎìúÎûòÍ∑∏Ìï¥ Í∑†Ïó¥ÏùÑ ÌîºÌïòÍ≥† ÌÅ¨Î¶¨Ïä§ÌÉàÏùÑ ÏàòÏßëÌïòÏÑ∏Ïöî.' : 'Drag survivor to dodge fissures and gather ancient gems!'
    },
    {
      id: 'voxeldreamweaver',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† Ïä§ÌÉÄ Ìä∏Î†àÏù¥ÏÑú' : 'Blitz Star Tracer',
      icon: Trophy,
      color: 'from-blue-600 to-indigo-900',
      image: '/minigame_boss.png',
      characterId: 107,
      action: () => {
        setGameState('voxeldreamweaver');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'STAR-TRACER',
      guide: language === 'ko' ? 'Î≥Ñ ÎÖ∏ÎìúÎ•º ÏÜêÍ∞ÄÎùΩÏúºÎ°ú ÎìúÎûòÍ∑∏ÌïòÏó¨ Ï†êÏÑ†ÏúºÎ°ú ÌëúÏãúÎêú Î≥ÑÏûêÎ¶¨Î•º ÌïúÎ∂ìÍ∑∏Î¶¨Í∏∞Î°ú ÏôÑÏÑ±ÌïòÏÑ∏Ïöî.' : 'Drag seamlessly from star to star to connect all constellation lines in one continuous stroke!'
    },
    {
      id: 'voxellifeflame',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌîåÎ†àÏûÑ ÎîîÌéúÏä§' : 'Blitz Flame Defense',
      icon: Trophy,
      color: 'from-rose-600 to-pink-900',
      image: '/minigame_boss.png',
      characterId: 108,
      action: () => {
        setGameState('voxellifeflame');
      },
      category: 'arcade',
      isNew: true,
      badgeText: 'FLAME-DEFENSE',
      guide: language === 'ko' ? 'Îã§Í∞ÄÏò§Îäî Ïñ¥Îë†Ïùò Î™¨Ïä§ÌÑ∞Î•º ÏßÅÏ†ë ÌÉ≠ÌïòÏó¨ ÌôîÏóºÍµ¨Î°ú Ï†ïÌôîÌïòÍ≥† ÏÉùÎ™ÖÏùò ÎÇòÎ¨¥Î•º ÏßÄÌÇ§ÏÑ∏Ïöî.' : 'Tap approaching shadow monsters to purify with homing fireballs and defend the tree!'
    },
    {
      id: 'voxelarcanenexus',
      title: language === 'ko' ? 'ÏïÑÏºÄÏù∏ Ï†¨ ÌÅ¨Îü¨Ïãú' : 'Arcane Gem Crush',
      icon: Sparkles,
      color: 'from-purple-600 to-indigo-700',
      image: '/minigame_boss.png',
      characterId: 109,
      action: () => {
        setGameState('voxelarcanenexus');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'MATCH-3',
      guide: language === 'ko' ? 'Ïù∏Ï†ëÌïú ÏõêÏÜå Î≥¥ÏÑùÏùÑ Ïä§ÏôÄÏù¥ÌîÑ/ÌÉ≠ÌïòÏó¨ 3Í∞ú Ïù¥ÏÉÅ ÏùºÎ†¨Î°ú Îß§Ïπ≠ÌïòÍ≥† Ïó∞ÏáÑ Ìè≠Î∞ú ÏΩ§Î≥¥Î•º ÌÑ∞Îú®Î¶¨ÏÑ∏Ïöî.' : 'Swap adjacent element gems to match 3+ in a row and trigger massive cascade combos!'
    },
    {
      id: 'voxeldreadshadow',
      title: language === 'ko' ? 'Î∏îÎ¶¨Ï∏† ÌîÑÎ¶¨Ï¶ò Î†àÏù¥Ï†Ä' : 'Blitz Prism Laser',
      icon: Trophy,
      color: 'from-cyan-900 to-purple-950',
      image: '/minigame_boss.png',
      characterId: 110,
      action: () => {
        setGameState('voxeldreadshadow');
      },
      category: 'puzzle',
      isNew: true,
      badgeText: 'PRISM-LASER',
      guide: language === 'ko' ? 'ÌîÑÎ¶¨Ï¶ò Í±∞Ïö∏ÏùÑ ÌÉ≠ÌïòÏó¨ 90ÎèÑ ÌöåÏ†ÑÏãúÌÇ§Í≥† Î†àÏù¥Ï†Ä ÎπõÏùÑ Ïö∞ÌïòÎã® ÏÑÄÎèÑÏö∞ ÏΩîÏñ¥Ïóê Ïó∞Í≤∞ÌïòÏÑ∏Ïöî.' : 'Tap prism mirrors to rotate 90 degrees and connect laser beam to the target core!'
    }
  ];

  // Listen to randomPlayTrigger from global bottom navbar
  useEffect(() => {
    if (randomPlayTrigger && randomPlayTrigger > 0) {
      if (modes.length === 0) return;
      const randomMode = modes[Math.floor(Math.random() * modes.length)];
      if (randomMode) {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        recordModePlay(randomMode.id);
        randomMode.action();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [randomPlayTrigger]);

  // Listen to preselectedGameId from dice roll
  useEffect(() => {
    if (!preselectedGameId) return;
    const mode = modes.find(m => m.id === preselectedGameId);
    if (mode) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      recordModePlay(mode.id);
      mode.action();
    }
  }, [preselectedGameId]);

  // =========================================================================
  // GLOBAL BACK BUTTON CUSTOM EVENT INTERCEPTOR
  // =========================================================================
  useEffect(() => {
    const handleGlobalBackEvent = (e: Event) => {
      // 1. Ïä§ÎÑ§Ïù¥ÌÅ¨/ÏäàÌåÖ Î™®Îìú
      if (['snake', 'shooting'].includes(gameState)) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      // 1.6. Ïò§Î™©/2048/Î©îÎ™®Î¶¨Îß§Ïπò Î™®Îìú
      if (['gomoku', 'memorymatch', 'slide2048'].includes(gameState)) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (gameState === 'cardjumper') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (gameState === 'cardtap') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (gameState === 'cardflip') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (gameState === 'cardslide') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (gameState === 'cardsorcery') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (gameState === 'cardslot') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (gameState === 'cardheist') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (gameState === 'cardrush') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      if (['breakout', 'minesweeper', 'pacman', 'tictactoe', 'trexrunner', 'voxeldefense', 'pixelstrike', 'voxelparkour', 'voxelbattlegrounds', 'voxeldungeon', 'voxelspace', 'voxelzombie', 'voxelsiege', 'voxeltitan', 'voxeldeepsea', 'voxelacefighter', 'voxeldriftmaster', 'voxelmonsterisle', 'voxelcyberninja', 'voxelraftsurvival', 'voxelsnowboard', 'voxelpinball', 'voxelpirate', 'voxelovercooked', 'voxelprophunt', 'voxelquantum', 'voxelrollinghero', 'voxelsupersmash', 'voxeltowercraft', 'voxelbeatblaster', 'voxelcastleblaster', 'voxelfactorycraft', 'voxelsuperstrikers', 'voxelgladiatorcolosseum', 'voxeldragonslayer', 'voxelarcherhero', 'voxelvampiresurvival', 'voxeltankbounce', 'voxelninjaslash', 'voxelgolfmaster', 'voxellumberjacktycoon', 'voxelfishingmaster', 'voxelfirerescue', 'voxelwindhunter', 'voxelsubwayrunner', 'voxelcranemaster', 'voxelmonstertruck', 'voxeltowerstack', 'voxelslamdunk', 'voxelcoastertycoon', 'voxelsniperhunter', 'voxeljetskiwater'].includes(gameState)) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      // 2. ÎîîÌéúÏä§ Î™®Îìú
      if (gameState === 'defense') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        window.dispatchEvent(new CustomEvent('defense-exit-request'));
        return;
      }

      // 3. Ïö¥Îèô Î™®Îìú
      if (gameState === 'running') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setConfirmModal({
          isOpen: true,
          title: language === 'ko' ? 'Í≤ΩÍ≥†' : 'WARNING',
          message: language === 'ko'
            ? 'Ïö¥ÎèôÏùÑ Ï§ëÎã®ÌïòÍ≥† ÎÇòÍ∞ÄÏãúÍ≤†ÏäµÎãàÍπå? ÌöçÎìùÌïú Î≥¥ÏÉÅÏù¥ Ï¶ùÎ∞úÌï† Ïàò ÏûàÏäµÎãàÎã§. Ï§ëÏßÄ Î≤ÑÌäºÏùÑ ÎàÑÎ•¥Î©¥ Í∏∞Î°ùÏù¥ ÏïàÏ†ÑÌïòÍ≤å Ï†ÄÏû•Îê©ÎãàÎã§.'
            : 'Stop and exit? Rewards might be lost. Press STOP button to save data safely.',
          onConfirm: () => {
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            setIsRunningActive(false);
            setGameState('modeSelect');
          }
        });
        return;
      }

      // 4. ÎçòÏ†Ñ Î∞∞ÌãÄ Î™®Îìú
      if (isDungeonBattleActive) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setIsDungeonBattleActive(false);
        setGameState('dungeon');
        setIsDungeonActive(true);
        setDungeonMonsters([]);
        setDungeonPlayerPos({ x: 50, y: 50 });
        saveDungeonState(true, { x: 50, y: 50 });
        initDungeonMonsters();
        return;
      }

      // 4. ÎçòÏ†Ñ Îßµ Î™®Îìú
      if (isDungeonActive) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setIsDungeonActive(false);
        saveDungeonState(false);
        setGameState('modeSelect');
        return;
      }

      // 5. Î≥¥Ïä§ Î™®Îìú ÎåÄÍ∏∞Ïã§
      if (isBossActive) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setIsBossActive(false);
        saveBossState(false);
        setGameState('modeSelect');
        return;
      }



      // 7. Ïä§ÌÜ†Î¶¨ Î™®Îìú ÏßÑÌñâ
      if (gameState === 'story') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setIsStoryActive(false);
        saveStoryProgress(storyAct, storyStep, false);
        setGameState('modeSelect');
        return;
      }

      // 7. ÌîÑÎ¶¨Îß§Ïπò (Îß§Ïπ≠ ÏÑ§Ï†ï ÎåÄÍ∏∞ ÌôîÎ©¥)
      if (gameState === 'preMatch') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('lobby');
        return;
      }

      // 8. Îß§Ïπ≠ Í≤ÄÏÉâ Ï§ë ÎòêÎäî ÏΩîÏù∏ ÌîåÎ¶Ω Ï§ë
      if (gameState === 'searching' || isCoinFlipping) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('lobby');
        setIsCoinFlipping(false);
        setCoinWinner(null);
        setCurrentMatchId(null);
        setMatchInfo(null);
        return;
      }

      // 9. Ïπ¥Îìú ÎåÄÏ†Ñ ÏßÑÌñâ Ï§ë (ÎòêÎäî Í≤∞Í≥º ÌôîÎ©¥)
      if (gameState === 'playing') {
        e.preventDefault();
        if (!gameOver) {
          setShowForfeitConfirm(true);
        } else {
          handleExitMatch(false);
        }
        return;
      }

      // 10. Î°úÎπÑ Î™®Îìú (3x3 Îßµ ÎåÄÍ∏∞Ïã§)
      if (gameState === 'lobby') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }
    };

    window.addEventListener('global-back', handleGlobalBackEvent);
    return () => {
      window.removeEventListener('global-back', handleGlobalBackEvent);
    };
  }, [
    gameState,
    isDungeonBattleActive,
    isDungeonActive,
    isBossActive,
    isStoryActive,
    storyAct,
    storyStep,
    isCoinFlipping,
    gameOver,
    language,
    playSfx,
    initDungeonMonsters,
    handleExitMatch
  ]);



  if (gameState === 'defense') {
    return (
      <DefenseGame
        language={language}
        sns={sns || 0}
        updateSns={updateSns}
        playSfx={playSfx}
        recordMatchResult={recordMatchResult}
        playerDeck={playerDeck}
        lowSpecMode={lowSpecMode}
        onExit={() => {
          setGameState('modeSelect');
          saveDefenseState(false);
        }}
        showDefenseTestConsole={showDefenseTestConsole}
        setShowDefenseTestConsole={setShowDefenseTestConsole}
      />
    );
  }

  if (gameState === 'running' || gameState === 'treasure') {
    return (
      <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[#1a1a2e] text-white overflow-y-auto relative pb-20 select-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #2a2a4e 0%, #1a1a2e 100%)`,
          boxShadow: 'inset 0 0 100px rgba(0, 255, 255, 0.25)'
        }}
      >
        {/* Cyber Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0" 
             style={{ 
               backgroundImage: `linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)`,
               backgroundSize: '80px 80px',
               maskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 95%)'
             }} 
        />

        {/* Header */}
        <header className="h-16 flex items-center justify-between border-b border-white/10 px-6 bg-slate-950/80 backdrop-blur-md z-50 shrink-0 relative font-sans">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            {gameState === 'treasure' ? (
              <Gift className="text-amber-400 animate-pulse" size={24} />
            ) : (
              <Navigation className="text-emerald-400 animate-pulse" size={24} />
            )}
            <h2 className="text-lg font-black italic uppercase tracking-tight text-white text-center">
              {gameState === 'treasure' ? t('mode_treasure', language) : t('mode_running', language)}
            </h2>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </header>

        {/* Workout info bar */}
        <div className="bg-slate-950/40 border-b border-white/10 px-6 py-3 flex items-center justify-between z-40 shrink-0 font-sans backdrop-blur-md">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase">DISTANCE</span>
            <span className="text-lg font-black text-emerald-400">{runningDistance.toFixed(1)} m</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase">CALORIES</span>
            <span className="text-lg font-black text-orange-400">{runningCalories.toFixed(1)} kcal</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase">EARNED SNS</span>
            <span className="text-lg font-black text-indigo-400">+{runningEarnedSns} SNS</span>
          </div>
        </div>

        {/* Geolocation Denied warning Banner */}
        {isRunningLocationDenied && (
          <div className="bg-red-950/80 border-b border-red-500/30 px-6 py-2.5 flex items-center justify-center text-xs font-bold gap-2 text-red-200">
            <AlertCircle size={16} className="text-red-400" />
            <span>GPS Ïã†Ìò∏ ÏàòÏã† Ïã§Ìå® ÎòêÎäî Í∂åÌïúÏù¥ Í±∞Î∂ÄÎêòÏóàÏäµÎãàÎã§. Í∏∞Í∏∞Ïùò ÏúÑÏπòÏÑ§Ï†ïÏùÑ ÌôúÏÑ±ÌôîÌï¥Ï£ºÏÑ∏Ïöî.</span>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 p-4 flex flex-col min-h-0 relative">
          <div 
            id="running-map" 
            className="flex-1 w-full border border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative z-10"
            style={{ minHeight: '350px' }}
          />

          {/* Treasure Left Badge (Floating on Map) */}
          {gameState === 'treasure' && (
            <div className="absolute top-8 right-8 z-20 bg-slate-900/90 border border-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-bold text-xs font-sans">
              <span className="text-base">üéÅ</span>
              <span>{language === 'ko' ? 'ÎÇ®ÏùÄ Î≥¥Î¨º' : 'Chests'}: <span className="text-amber-400 font-extrabold">{treasureChests.filter(c => !c.isOpened).length} / 5</span></span>
            </div>
          )}

          {/* Stop Workout Button */}
          <div className="w-full mt-4 flex justify-center z-20">
            <button 
              onClick={handleStopRunning}
              className="w-full max-w-md py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black uppercase text-base tracking-widest rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <X size={20} />
              <span>STOP WORKOUT</span>
            </button>
          </div>
        </div>

        {/* Real-time Card Draw Popup (Map Center) */}
        <AnimatePresence>
          {showRunningCardPopup && runningRecentlyEarnedCard && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100] p-4 bg-black/30">
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1.1, opacity: 1, y: 0 }}
                exit={{ scale: 1.3, opacity: 0, y: -50 }}
                className="w-full max-w-xs border border-amber-400 bg-slate-900 text-white p-5 rounded-2xl shadow-[0_20px_50px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center pointer-events-auto"
              >
                <span className="text-xs font-black uppercase tracking-wider mb-2 animate-pulse text-amber-400">
                  üéâ CARD DISCOVERED! (10m)
                </span>
                <div className={`w-32 aspect-[5/7] border border-amber-400/30 rounded-lg overflow-hidden shadow-lg relative flex flex-col items-center justify-center p-1 bg-slate-950`}>
                  {/* Character image mapping index */}
                  <div className="w-full h-full flex items-center justify-center relative pointer-events-none overflow-hidden rounded-md">
                    {runningRecentlyEarnedCard.imageUrl ? (
                      <img 
                        src={runningRecentlyEarnedCard.imageUrl} 
                        alt="Earned Card"
                        className="w-full h-full object-contain pixelated scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                      />
                    ) : (
                      <div 
                        className="w-[180%] aspect-square transform-gpu scale-95"
                        style={getCardSpriteStyle(
                          runningRecentlyEarnedCard.imageIndex !== undefined ? runningRecentlyEarnedCard.imageIndex : runningRecentlyEarnedCard.id
                        )}
                      />
                    )}
                  </div>
                </div>
                <span className="mt-2 font-black text-sm text-center italic uppercase leading-none">
                  {runningRecentlyEarnedCard.title_en || runningRecentlyEarnedCard.title_dis}
                </span>
                <span className="text-[9px] font-black text-black/50 tracking-wider">
                  POWER: {runningRecentlyEarnedCard.power} TP
                </span>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Real-time Treasure Discover Popup (Map Center) */}
        <AnimatePresence>
          {showTreasureChestPopup && treasureRecentlyEarned && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100] p-4 bg-black/45 backdrop-blur-[1px]">
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1.05, opacity: 1, y: 0 }}
                exit={{ scale: 1.2, opacity: 0, y: -50 }}
                className="w-full max-w-sm border border-amber-400 bg-slate-950 text-white p-6 rounded-2xl shadow-[0_20px_50px_rgba(245,158,11,0.25)] flex flex-col items-center justify-center pointer-events-auto font-sans"
              >
                <span className="text-xs font-black uppercase tracking-wider mb-2 animate-pulse text-amber-400">
                  üéÅ {t('mode_treasure', language)} - {language === 'ko' ? 'Î≥¥Î¨º ÌöçÎìù!' : 'TREASURE DISCOVERED!'}
                </span>
                
                <div className="flex gap-6 items-center justify-center mt-3 w-full">
                  {/* 1. Card */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 aspect-[5/7] border border-amber-400/30 rounded-lg overflow-hidden shadow-lg relative flex flex-col items-center justify-center p-1 bg-slate-900">
                      <div className="w-full h-full flex items-center justify-center relative pointer-events-none overflow-hidden rounded-md">
                        {treasureRecentlyEarned.card.imageUrl ? (
                          <img 
                            src={treasureRecentlyEarned.card.imageUrl} 
                            alt="Earned Card"
                            className="w-full h-full object-contain pixelated scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                          />
                        ) : (
                          <div 
                            className="w-[180%] aspect-square transform-gpu scale-95"
                            style={getCardSpriteStyle(
                              Number(treasureRecentlyEarned.card.imageIndex !== undefined ? treasureRecentlyEarned.card.imageIndex : treasureRecentlyEarned.card.id)
                            )}
                          />
                        )}
                      </div>
                    </div>
                    <span className="mt-2 font-black text-[11px] text-center uppercase leading-none max-w-[100px] truncate">
                      {treasureRecentlyEarned.card.title_en || treasureRecentlyEarned.card.title_dis}
                    </span>
                    <span className="text-[8px] font-black text-slate-400 tracking-wider mt-0.5">
                      POWER: {treasureRecentlyEarned.card.power} TP
                    </span>
                  </div>
                  
                  {/* 2. Item */}
                  {treasureRecentlyEarned.item && (
                    <div className="flex flex-col items-center">
                      <div className="w-24 aspect-[5/7] border border-blue-400/30 rounded-lg shadow-lg flex flex-col items-center justify-center p-2 bg-slate-900 relative">
                        <ItemIcon 
                          imageIndex={treasureRecentlyEarned.item.imageIndex} 
                          emoji={treasureRecentlyEarned.item.emoji} 
                          size={48} 
                        />
                        <span className="absolute bottom-1.5 text-[8px] font-black uppercase tracking-wider text-blue-400 bg-blue-950/60 px-1 rounded">
                          {treasureRecentlyEarned.item.rarity}
                        </span>
                      </div>
                      <span className="mt-2 font-black text-[11px] text-center uppercase leading-none max-w-[100px] truncate">
                        {language === 'ko' ? treasureRecentlyEarned.item.name_ko : treasureRecentlyEarned.item.name_en}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 tracking-wider mt-0.5">
                        SLOT: {treasureRecentlyEarned.item.slot.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Anti-cheat popup modal */}
        <AnimatePresence>
          {showAnticheatPopup && (
            <div className="fixed inset-0 z-[102] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm border border-red-500/30 bg-red-950/90 backdrop-blur-md p-6 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-rose-500 animate-pulse" />
                <h3 className="text-2xl font-black italic uppercase tracking-wider text-red-450 mb-2">
                  {t('anticheat_title', language)}
                </h3>
                <p className="text-red-200 text-xs mb-4">
                  {t('anticheat_desc', language)}
                </p>
                <button
                  onClick={() => {
                    setShowAnticheatPopup(false);
                    setGameState('lobby');
                  }}
                  className="w-full bg-slate-900 text-red-400 border border-red-500/40 py-3 rounded-xl font-black uppercase text-sm hover:bg-red-950 active:scale-[0.98] transition-all"
                >
                  {t('anticheat_return_lobby', language)}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sync summary popup modal */}
        <AnimatePresence>
          {showRunningSyncSummaryModal && (
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md border border-slate-800 bg-slate-900/95 backdrop-blur-md p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse" />
                <h3 className="text-2xl font-black italic uppercase tracking-wider text-emerald-400 mb-2">
                  {activeRunningMode === 'treasure' ? 'TREASURE BATTLE COMPLETED' : 'WORKOUT COMPLETED'}
                </h3>
                <p className="text-slate-300 text-xs mb-4">
                  {activeRunningMode === 'treasure'
                    ? (language === 'ko' ? 'Ïã§ÏãúÍ∞Ñ Î≥¥Î¨ºÏ∞æÍ∏∞ Îç∞Ïù¥ÌÑ∞Í∞Ä Î≥∏Ïù∏Ïùò SNS Í≥ÑÏ†ïÍ≥º ÏÑ±Í≥µÏ†ÅÏúºÎ°ú ÎèôÍ∏∞ÌôîÎêòÏóàÏäµÎãàÎã§.' : 'Real-time treasure hunt data has been successfully synchronized with your SNS account.')
                    : (language === 'ko' ? 'Ïã§ÏãúÍ∞Ñ Ïö¥Îèô Îç∞Ïù¥ÌÑ∞Í∞Ä Î≥∏Ïù∏Ïùò SNS Í≥ÑÏ†ïÍ≥º ÏÑ±Í≥µÏ†ÅÏúºÎ°ú ÎèôÍ∏∞ÌôîÎêòÏóàÏäµÎãàÎã§.' : 'Real-time workout data has been successfully synchronized with your SNS account.')}
                </p>

                {/* Summary Statistics */}
                {activeRunningMode === 'treasure' ? (
                  <div className="grid grid-cols-4 gap-1 border border-slate-800 bg-slate-950 p-2.5 rounded-xl mb-4 text-center">
                    <div>
                      <span className="block text-[7px] font-bold text-slate-400">DISTANCE</span>
                      <span className="text-xs font-black text-white">{runningDistance.toFixed(1)}m</span>
                    </div>
                    <div>
                      <span className="block text-[7px] font-bold text-slate-400">CALORIES</span>
                      <span className="text-xs font-black text-white">{runningCalories.toFixed(1)}kcal</span>
                    </div>
                    <div>
                      <span className="block text-[7px] font-bold text-slate-400">CHESTS</span>
                      <span className="text-xs font-black text-amber-400">{treasureChests.filter(c => c.isOpened).length} / 5</span>
                    </div>
                    <div>
                      <span className="block text-[7px] font-bold text-slate-400">EARNED</span>
                      <span className="text-xs font-black text-white">+{runningEarnedSns} SNS</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 border border-slate-800 bg-slate-950 p-3 rounded-xl mb-4 text-center">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400">DISTANCE</span>
                      <span className="text-sm font-black text-white">{runningDistance.toFixed(1)}m</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400">CALORIES</span>
                      <span className="text-sm font-black text-white">{runningCalories.toFixed(1)}kcal</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400">EARNED</span>
                      <span className="text-sm font-black text-white">+{runningEarnedSns} SNS</span>
                    </div>
                  </div>
                )}

                {/* Earned Cards count */}
                {runningEarnedCards.length > 0 && (
                  <div className="border border-slate-800 bg-indigo-950/40 p-2 rounded-xl mb-4 text-center text-xs">
                    <span className="text-yellow-400 font-black">üéâ ÌöçÎìùÌïú Ïπ¥Îìú: {runningEarnedCards.length}Ïû•!</span>
                    <div className="flex gap-1.5 justify-center flex-wrap mt-1.5">
                      {runningEarnedCards.map((c, idx) => (
                        <div key={idx} className="w-8 h-8 border border-white/20 bg-slate-800 rounded flex items-center justify-center text-[10px] font-black uppercase text-white">
                          C{c.id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Map polyline line display */}
                <div className="border border-slate-800 bg-slate-950 rounded-xl overflow-hidden mb-6 relative">
                  {runningMapImage ? (
                    <img 
                      src={runningMapImage} 
                      alt="Running Map Summary" 
                      className="w-full h-auto object-cover" 
                      style={{ minHeight: '176px' }}
                    />
                  ) : (
                    <div 
                      id="summary-map" 
                      className="w-full h-44 z-10"
                      style={{ minHeight: '176px' }}
                    />
                  )}
                  <div className="absolute bottom-2 left-2 z-20 bg-black/60 px-2 py-0.5 rounded text-[8px] font-black text-slate-300">
                    PATH RECORDED LOCALLY
                  </div>
                </div>

                {/* Action buttons (Share / Close) */}
                <div className="flex gap-3">
                  <button 
                    onClick={async () => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setIsSharing(true);
                      
                      let base64Image = runningMapImage;
                      if (!base64Image) {
                        base64Image = generateMapBase64Image(runningCoordinates, runningDistance, runningCalories, runningEarnedSns);
                      }
                      
                      let claimedTreeReward = false;
                      // Î∂ÄÏßÄÎü∞Ïùò ÎÇòÎ¨¥ Ïø®ÌÉÄÏûÑ ÌôïÏù∏ (10ÏãúÍ∞Ñ)
                      try {
                        const lastClaimTime = localStorage.getItem('hero_last_diligence_time');
                        const now = Date.now();
                        const cooldownMs = 10 * 60 * 60 * 1000;
                        if (!lastClaimTime || (now - parseInt(lastClaimTime, 10)) >= cooldownMs) {
                          localStorage.setItem('hero_last_diligence_time', now.toString());
                          if (updateSns) {
                            updateSns(1000, 'tree_of_diligence', 'earned');
                          }
                          claimedTreeReward = true;
                        }
                      } catch (e) {
                        console.warn("Failed diligence tree check:", e);
                      }

                      try {
                        const postMessage = activeRunningMode === 'treasure'
                          ? `üéÅ Î≥¥Î¨º ÎåÄÏ†Ñ ÏôÑÏ£º Í∏∞Î°ù! Ï¥ù ${runningDistance.toFixed(1)}m Ïù¥ÎèôÌïòÎ©∞ Î≥¥Î¨ºÏÉÅÏûê ${treasureChests.filter(c => c.isOpened).length}Í∞úÎ•º ÌöçÎìùÌïòÍ≥† +${runningEarnedSns} SNS Ìè¨Ïù∏Ìä∏Î•º ÎèôÍ∏∞ÌôîÌñàÏäµÎãàÎã§!${claimedTreeReward ? ' (Î∂ÄÏßÄÎü∞Ïùò ÎÇòÎ¨¥ Î≥¥ÏÉÅ 1,000 SNS Ï∂îÍ∞Ä ÌöçÎìù)' : ''}`
                          : `üèÉ‚Äç‚ôÇÔ∏è Îü¨Îãù ÎåÄÏ†Ñ ÏôÑÏ£º Í∏∞Î°ù! Ï¥ù ${runningDistance.toFixed(1)}m Ïù¥ÎèôÌïòÎ©∞ ${runningCalories.toFixed(1)}kcalÎ•º ÏÜåÎ™®ÌïòÍ≥† +${runningEarnedSns} SNS Ìè¨Ïù∏Ìä∏Î•º ÎèôÍ∏∞ÌôîÌñàÏäµÎãàÎã§!${claimedTreeReward ? ' (Î∂ÄÏßÄÎü∞Ïùò ÎÇòÎ¨¥ Î≥¥ÏÉÅ 1,000 SNS Ï∂îÍ∞Ä ÌöçÎìù)' : ''}`;

                        const newPost = await createCommunityPost(
                          postMessage,
                          undefined,
                          effectiveUser || { uid: 'guest-id', displayName: 'Anonymous Runner', photoURL: null },
                          'running',
                          base64Image ? [base64Image] : undefined
                        );
                        
                        setIsSharing(false);
                        setShowRunningSyncSummaryModal(false);
                        setIsRunningActive(false);
                        setGameState('modeSelect');

                        setConfirmModal({
                          isOpen: true,
                          title: language === 'ko' ? 'Í≥µÏú† ÏÑ±Í≥µ' : 'SHARE SUCCESS',
                          message: claimedTreeReward 
                            ? (language === 'ko' ? 'Ïª§ÎÆ§ÎãàÌã∞ Í≥µÏú† ÏÑ±Í≥µ! (Î∂ÄÏßÄÎü∞Ïùò ÎÇòÎ¨¥ Î≥¥ÏÉÅ 1,000 SNS Ï∂îÍ∞Ä ÌöçÎìù)' : 'Shared successfully! (+1,000 SNS Diligence Tree Reward)')
                            : (language === 'ko' ? 'Ïª§ÎÆ§ÎãàÌã∞ Í≥µÏú† ÏÑ±Í≥µ!' : 'Shared to community successfully!'),
                          onConfirm: () => {
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            window.history.pushState({}, '', `?view=community&postId=${newPost.id}`);
                            if (setView) setView('community');
                          }
                        });
                      } catch (err: any) {
                        console.error("Firestore post creation failed:", err);
                        setIsSharing(false);
                        setShowRunningSyncSummaryModal(false);
                        setIsRunningActive(false);
                        setGameState('modeSelect');

                        let errorMsg = (language === 'ko' ? 'Í≥µÏú† Ï§ë Ïò§Î•òÍ∞Ä Î∞úÏÉùÌñàÏäµÎãàÎã§: ' : 'Error sharing post: ') + (err?.message || err);
                        if (err && err.code === 'permission-denied') {
                          errorMsg = language === 'ko' 
                            ? 'Î°úÍ∑∏Ïù∏ ÏÑ∏ÏÖòÏù¥ ÎßåÎ£åÎêòÏóàÍ±∞ÎÇò ÎπÑÌöåÏõê ÏÉÅÌÉúÏù¥ÎØÄÎ°ú ÌÅ¥ÎùºÏö∞Îìú Í≥µÏú†Îäî ÏÉùÎûµÌïòÍ≥† Î°úÏª¨Ïóê Ï†ÄÏû•ÎêòÏóàÏäµÎãàÎã§.' 
                            : 'Cloud sharing skipped and saved locally as guest/permission denied.';
                        }
                        
                        setConfirmModal({
                          isOpen: true,
                          title: language === 'ko' ? 'ÏïåÎ¶º' : 'NOTIFICATION',
                          message: errorMsg,
                          onConfirm: () => {
                            setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          }
                        });
                      }
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-400 hover:to-lime-500 text-slate-955 font-black uppercase text-xs tracking-wider rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>SHARE</span>
                  </button>
                  <button 
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                      setShowRunningSyncSummaryModal(false);
                      setIsRunningActive(false);
                      setGameState('modeSelect');
                    }}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black uppercase text-xs tracking-wider rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>CLOSE</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              />
              <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="bg-slate-900 text-white w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-800 relative z-[10000]"
              >
                <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 shadow-md">
                    <ShieldAlert size={20} className="text-amber-400 animate-bounce" />
                  </div>
                  <h2 className="text-base font-black italic uppercase tracking-tight leading-tight text-slate-100">{confirmModal.title}</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm font-bold text-slate-350 leading-relaxed whitespace-pre-line">{confirmModal.message}</p>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-slate-750 font-black uppercase italic text-sm tracking-wider rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {language === 'ko' ? 'Ï∑®ÏÜå' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black uppercase italic text-sm tracking-wider rounded-xl shadow-[0_5px_15px_rgba(220,38,38,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {language === 'ko' ? 'ÌôïÏù∏' : 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (gameState === 'dungeon') {
    if (isDungeonBattleActive) {
      return (
        <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-slate-950 text-white overflow-y-auto relative pb-20 select-none">
          {/* Header */}
          <header className="h-16 flex items-center justify-between border-b border-slate-800 px-6 bg-slate-950 z-50 shrink-0 relative font-sans">
            <div className="w-10" />
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
              <Swords className="text-red-500 animate-pulse" size={20} />
              <h2 className="text-base font-bold uppercase tracking-wide text-white text-center">
                {dungeonBattleIsBoss ? "BOSS SHOWDOWN (Î≥¥Ïä§ ÎåÄÏ†Ñ)" : "FIELD HUNTING (ÏùºÎ∞ò ÏÇ¨ÎÉ•)"}
              </h2>
            </div>
            <div className="flex items-center gap-3 z-50">
              <div className={cn(
                "relative inline-flex items-center justify-center overflow-hidden rounded-xl transition-all",
                isAutoBattle ? "p-[2px] shadow-[0_0_14px_rgba(59,130,246,0.6)]" : ""
              )}>
                {isAutoBattle && (
                  <div className="absolute -inset-[180%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_180deg,#1d4ed8_270deg,#60a5fa_330deg,#93c5fd_360deg)]" />
                )}
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    if (setIsAutoBattle) {
                      const nextVal = !isAutoBattle;
                      setIsAutoBattle(nextVal);
                      localStorage.setItem('hero_auto_battle_setting', JSON.stringify(nextVal));
                    }
                  }}
                  className={cn(
                    "relative z-10 px-3 py-1.5 rounded-[10px] text-xs font-bold tracking-wider transition-all select-none cursor-pointer flex items-center gap-1 active:scale-95",
                    isAutoBattle 
                      ? "bg-slate-950 text-blue-300" 
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                  )}
                >
                  <Zap size={12} className={cn(isAutoBattle && "fill-blue-400 text-blue-400 animate-pulse")} />
                  <span>{isAutoBattle ? "AUTO ON" : "AUTO OFF"}</span>
                </button>
              </div>
              <div className="px-4 py-1.5 bg-red-650 text-white font-bold text-xs rounded-lg shadow-sm">
                <span className="font-bold text-xs uppercase">
                  {dungeonBattleStatus === 'intro' ? "Ready..." : dungeonBattleStatus === 'playing' ? `${dungeonBattleTurn === 'player' ? "PLAYER TURN" : "ENEMY TURN"}` : "FINISH"}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 max-w-4xl mx-auto w-full flex flex-col gap-6 justify-center">
            {/* Battlefield (Vertical card-battle layout) */}
            <div className="flex flex-col gap-8 justify-between items-center w-full min-h-[500px] py-4 relative">
              
              {/* Opponent Deck (Top side) */}
              <div className={cn(
                "flex flex-col gap-3 justify-center items-center p-4 rounded-3xl transition-all duration-300 w-full max-w-4xl border",
                dungeonBattleTurn === 'opponent' && dungeonBattleStatus === 'playing' ? "bg-red-950/20 border-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.1)]" : "border-slate-800 bg-slate-900/40"
              )}>
                <h3 className="text-xs font-bold uppercase text-red-400 border-b border-red-500/30 pb-1 mb-2 flex items-center gap-2 font-sans">
                  <span>ENEMY TEAM</span>
                  {dungeonBattleTurn === 'opponent' && dungeonBattleStatus === 'playing' && (
                    <span className="text-[10px] text-yellow-400 animate-pulse font-bold">(ATTACKING...)</span>
                  )}
                </h3>
                <div className="flex flex-row gap-4 overflow-x-auto w-full justify-center py-2 font-sans">
                  {dungeonOpponentDeck.map((item) => {
                    const isAttacking = dungeonAttackingCardId === item.id;
                    const isTarget = dungeonAttackingTargetId === item.id;
                    const isDead = item.hp <= 0;
                    return (
                      <motion.div
                        key={item.id}
                        animate={
                          isAttacking 
                            ? { y: [0, 180, 0], scale: 1.1, zIndex: 50 } 
                            : isTarget 
                            ? { x: [0, -10, 10, -10, 0], rotate: [0, -2, 2, -2, 0] } 
                            : {}
                        }
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "relative w-16 sm:w-24 md:w-36 flex flex-col items-center p-1 sm:p-2 rounded-xl border border-slate-800 bg-slate-900 shadow-sm transition-all shrink-0",
                          isDead ? "opacity-30 grayscale" : "hover:border-red-400",
                          isTarget && "border-red-500 bg-red-950/50"
                        )}
                      >
                        {/* Card Image */}
                        <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-slate-800 mb-1 relative flex items-center justify-center">
                          <CardItem 
                            card={item.card}
                            isLocked={true}
                            className="w-full h-full"
                            lowSpecMode={lowSpecMode}
                            language={language}
                          />
                        </div>

                        {/* HP Bar */}
                        <div className="w-full mt-1.5 space-y-0.5">
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 transition-all duration-350"
                              style={{ width: `${(item.hp / item.maxHp) * 100}%` }}
                            />
                          </div>
                          <div className="text-[8px] sm:text-[10px] font-bold text-center text-gray-300">
                            {t('field_hp', language).replace('{hp}', `${item.hp}/${item.maxHp}`)}
                          </div>
                        </div>

                        {/* Damage Popup Overlay */}
                        <AnimatePresence>
                          {dungeonDamagePopups.filter(p => p.targetCardId === item.id).map(pop => (
                            <motion.div
                              key={pop.id}
                              initial={{ opacity: 0, y: 10, scale: 0.5 }}
                              animate={{ opacity: 1, y: -40, scale: 1.5 }}
                              exit={{ opacity: 0 }}
                              className="absolute -top-4 font-black text-red-500 text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-[100]"
                            >
                              -{pop.amount}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Battle Logs or Action Status (Middle) */}
              <div className="w-full max-w-xl text-center py-2 min-h-[40px] flex items-center justify-center border-y border-white/10">
                {dungeonBattleLog.length > 0 && (
                  <span className="text-xs text-yellow-400 font-bold tracking-wider animate-pulse">
                    {dungeonBattleLog[dungeonBattleLog.length - 1]}
                  </span>
                )}
              </div>

              {/* My Deck (Bottom side) */}
              <div className={cn(
                "flex flex-col gap-3 justify-center items-center p-4 rounded-3xl transition-all duration-300 w-full max-w-4xl border",
                dungeonBattleTurn === 'player' && dungeonBattleStatus === 'playing' ? "bg-blue-950/20 border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)]" : "border-slate-800 bg-slate-900/40"
              )}>
                <h3 className="text-xs font-bold uppercase text-blue-400 border-b border-blue-500/30 pb-1 mb-2 flex items-center gap-2 font-sans">
                  <span>MY TEAM</span>
                  {dungeonBattleTurn === 'player' && dungeonBattleStatus === 'playing' && (
                    <span className="text-[10px] text-yellow-400 animate-pulse font-bold">(ATTACKING...)</span>
                  )}
                </h3>
                <div className="flex flex-row gap-4 overflow-x-auto w-full justify-center py-2 font-sans">
                  {dungeonPlayerDeck.map((item) => {
                    const isAttacking = dungeonAttackingCardId === item.id;
                    const isTarget = dungeonAttackingTargetId === item.id;
                    const isDead = item.hp <= 0;
                    return (
                      <motion.div
                        key={item.id}
                        animate={
                          isAttacking 
                            ? { y: [0, -180, 0], scale: 1.1, zIndex: 50 } 
                            : isTarget 
                            ? { x: [0, -10, 10, -10, 0], rotate: [0, -2, 2, -2, 0] } 
                            : {}
                        }
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "relative w-16 sm:w-24 md:w-36 flex flex-col items-center p-1 sm:p-2 rounded-xl border border-slate-800 bg-slate-900 shadow-sm transition-all shrink-0",
                          isDead ? "opacity-30 grayscale" : "hover:border-blue-400",
                          isTarget && "border-red-500 bg-red-950/50"
                        )}
                      >
                        {/* Card Image */}
                        <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-slate-800 mb-1 relative flex items-center justify-center">
                          <CardItem 
                            card={item.card}
                            isLocked={true}
                            className="w-full h-full"
                            lowSpecMode={lowSpecMode}
                            language={language}
                          />
                        </div>

                        {/* HP Bar */}
                        <div className="w-full mt-1.5 space-y-0.5">
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-350"
                              style={{ width: `${(item.hp / item.maxHp) * 100}%` }}
                            />
                          </div>
                          <div className="text-[8px] sm:text-[10px] font-bold text-center text-gray-300">
                            {t('field_hp', language).replace('{hp}', `${item.hp}/${item.maxHp}`)}
                          </div>
                        </div>

                        {/* Damage Popup Overlay */}
                        <AnimatePresence>
                          {dungeonDamagePopups.filter(p => p.targetCardId === item.id).map(pop => (
                            <motion.div
                              key={pop.id}
                              initial={{ opacity: 0, y: 10, scale: 0.5 }}
                              animate={{ opacity: 1, y: -40, scale: 1.5 }}
                              exit={{ opacity: 0 }}
                              className="absolute -top-4 font-black text-red-500 text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,1)] z-[100]"
                            >
                              -{pop.amount}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>
          </main>

          {/* Results Modal */}
          <AnimatePresence>
            {showDungeonBattleResultModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
              >
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-slate-900 text-white w-full max-w-md rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 relative flex flex-col z-[1001]"
                >
                  <div className={cn(
                    "p-5 border-b border-slate-800 text-black flex items-center justify-between",
                    dungeonBattleWinner === 'player' ? "bg-gradient-to-r from-amber-400 to-yellow-400" : "bg-gradient-to-r from-red-600 to-rose-600 text-white"
                  )}>
                    <div className="flex items-center gap-2">
                      <Trophy size={24} className={dungeonBattleWinner === 'player' ? "text-black" : "text-white"} />
                      <h2 className={cn(
                        "text-lg font-black italic uppercase tracking-tight",
                        dungeonBattleWinner === 'player' ? "text-black" : "text-white"
                      )}>
                        {dungeonBattleWinner === 'player' ? "VICTORY! (ÏäπÎ¶¨)" : "DEFEAT (Ìå®Î∞∞)"}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 text-center bg-slate-900">
                    <div className={cn(
                      "w-20 h-20 rounded-full border border-slate-800 flex items-center justify-center mx-auto shadow-lg",
                      dungeonBattleWinner === 'player' ? "bg-yellow-100/10 text-yellow-400 animate-bounce" : "bg-red-100/10 text-red-500"
                    )}>
                      {dungeonBattleWinner === 'player' ? <Trophy size={36} /> : <Activity size={36} />}
                    </div>

                    <h3 className="text-2xl font-black italic leading-tight pt-2 px-2">
                      {dungeonBattleWinner === 'player' ? "ÌïÑÎìú Ï†ÑÌà¨ ÏäπÎ¶¨!" : "Ï†ÑÌà¨ÏóêÏÑú Ìå®Î∞∞ÌñàÏäµÎãàÎã§."}
                    </h3>

                    {dungeonBattleWinner === 'ai' && dungeonDefeatCountdown !== null && (
                      <div className="text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-3 py-1.5 rounded-xl animate-pulse inline-block">
                        {language === 'ko' ? `${dungeonDefeatCountdown}Ï¥à ÌõÑ ÏûêÎèôÏúºÎ°ú Îã´ÌûôÎãàÎã§...` : `Auto closing in ${dungeonDefeatCountdown}s...`}
                      </div>
                    )}

                    {dungeonBattleWinner === 'player' && (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner inline-block">
                        <span className="text-xs font-black uppercase opacity-60 block mb-1">REWARD</span>
                        <span className="text-2xl font-black italic text-yellow-400">+{dungeonBattleReward} SNS</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 border-t border-slate-800 bg-slate-950 flex justify-center">
                    <button
                      onClick={() => {
                        setDungeonDefeatCountdown(null);
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        closeDungeonBattleResult();
                      }}
                      className={cn(
                        "w-full py-4 text-white font-black uppercase italic tracking-wider rounded-xl shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                        dungeonBattleWinner === 'player' ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-450 hover:to-yellow-450 text-slate-900 shadow-yellow-500/10" : "bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-650 hover:to-slate-750"
                      )}
                    >
                      {dungeonBattleWinner === 'ai' && dungeonDefeatCountdown !== null
                        ? (language === 'ko' ? `ÌôïÏù∏ (${dungeonDefeatCountdown}Ï¥à)` : `Confirm (${dungeonDefeatCountdown}s)`)
                        : t('tournament_confirm_btn', language)}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          {renderCustomAlertModal()}
        </div>
      );
    }

    return (
        <div className="flex-1 flex flex-col w-full bg-slate-950 text-slate-100 overflow-y-auto relative min-h-0">
          {/* Header */}
          <header className="h-16 flex items-center justify-between border-b border-white/10 px-6 z-50 bg-black/50 backdrop-blur-md relative shrink-0">
            <div className="w-10" />
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
              <ScanLine className="text-[#0ff] animate-pulse" size={20} />
              <h2 className="text-xl font-black italic tracking-tight leading-none uppercase text-center text-[#0ff]">
                {t('mode_dungeon', language)}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-black/80 border border-[#0ff]/30 rounded-lg shadow-[0_0_10px_rgba(0,255,255,0.15)]">
              <span className="text-xs text-yellow-400 font-black">ü™ô {sns?.toLocaleString()}</span>
            </div>
          </header>

          {isGpsActive && gpsCoords ? (
            /* GPS Mode: Leaflet Map Background */
            <div className="flex-1 relative w-full h-full overflow-hidden min-h-[500px]">
              {/* Map Container */}
              <div ref={mapContainerRef} className="w-full h-full z-10" />

              {/* Premium Workout Floating Dashboard Card */}
              <div className="absolute top-24 right-4 z-50 pointer-events-auto max-w-sm w-[260px] animate-fade-in">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-[0_4px_24px_rgba(6,182,212,0.15)] text-white space-y-4 font-sans">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Activity size={18} className="animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">DUNGEON WORKOUT</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col font-sans">
                      <span className="text-[9px] uppercase text-white/50 tracking-wider font-semibold">Distance</span>
                      <span className="text-2xl font-bold text-cyan-400">
                        {workoutDistance.toFixed(1)}<span className="text-xs ml-0.5 font-normal text-white/70">m</span>
                      </span>
                      {/* Progress to next encounter (10m) */}
                      <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300"
                          style={{ width: `${Math.min(100, (workoutDistance / 10) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col font-sans">
                      <span className="text-[9px] uppercase text-white/50 tracking-wider font-semibold">Calories</span>
                      <span className="text-2xl font-bold text-orange-400">
                        {workoutCalories.toFixed(2)}<span className="text-xs ml-0.5 font-normal text-white/70">kcal</span>
                      </span>
                      <div className="text-[8px] text-white/40 mt-1 font-sans">
                        {(workoutCalories / 7.7).toFixed(3)}g fat burnt
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2.5 py-1.5 rounded-xl font-medium leading-relaxed whitespace-pre-line text-center font-sans">
                    üèÉ {language === 'ko' ? "10mÎ•º Í±∏Ïñ¥ Îã§Îãê ÎïåÎßàÎã§\nÍ∞ÄÏû• Í∞ÄÍπåÏö¥ AIÏôÄ ÏûêÎèôÏúºÎ°ú ÎçòÏ†Ñ ÎåÄÏ†ÑÏù¥ ÏãúÏûëÎê©ÎãàÎã§!" : "Walk 10m to auto-trigger\ndungeon battle with the nearest AI!"}
                  </div>
                </div>
              </div>

              {/* Map Interaction Hint */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-955/90 backdrop-blur-md text-white px-4 py-2.5 text-[10px] font-semibold rounded-full shadow-lg pointer-events-none tracking-tight uppercase whitespace-nowrap border border-white/5 font-sans">
                üìç {language === 'ko' ? "ÏßÄÎèÑÏùò Îπ®Í∞Ñ ÎßàÏª§Î•º ÌÉ≠ÌïòÎ©¥ ÎçòÏ†Ñ ÎåÄÏ†ÑÏùÑ ÏãúÏûëÌï† Ïàò ÏûàÏäµÎãàÎã§." : "TAP RED MARKERS TO ENGAGE DUNGEON BATTLE"}
              </div>
            </div>
          ) : (
            /* Lobby Field (Bright Cyberpunk Night City Style) */
            <div 
              ref={lobbyRef}
              onClick={handleLobbyClick}
              className="flex-1 relative bg-[#1a1a2e] overflow-hidden cursor-crosshair min-h-[500px]"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, #2a2a4e 0%, #1a1a2e 100%)`,
                boxShadow: 'inset 0 0 100px rgba(0, 255, 255, 0.25)'
              }}
            >
              {/* Brighter Cyber Grid Overlay */}
              <div className="absolute inset-0 opacity-30 pointer-events-none" 
                   style={{ 
                     backgroundImage: `linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)`,
                     backgroundSize: '80px 80px',
                     maskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 95%)'
                   }} 
              />

              {/* Static Background Grid */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-[0.1] pointer-events-none">
                {Array(144).fill(null).map((_, i) => (
                  <div key={`dungeon-lobby-grid-${i}`} className="border border-gray-800" />
                ))}
              </div>

              {/* NPCs (Robots + Users) */}
              {allChars.map((char) => {
                const currentPos = animatedPositions[char.id] || { x: char.x, y: char.y };
                return (
                <motion.div
                  key={char.id}
                  className="absolute flex flex-col items-center select-none"
                  style={{ zIndex: 10 }}
                  initial={{ scale: 0, opacity: 0, left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
                  animate={{ scale: 1, opacity: 1, left: `${currentPos.x}%`, top: `${currentPos.y}%` }}
                  transition={lowSpecMode ? { duration: 0 } : { left: { duration: 2, ease: "easeInOut" }, top: { duration: 2, ease: "easeInOut" } }}
                  whileHover={!lowSpecMode ? { scale: 1.1, zIndex: 100 } : {}}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (gameState === 'dungeon') {
                      handleDungeonEncounter(char);
                    } else {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      handleEncounter(char);
                    }
                  }}
                >
                  <div className="relative group cursor-pointer">
                    {/* AI Tag */}
                    {char.type === 'robot' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-650 text-white text-sm font-bold px-1.5 py-0.5 shadow-sm z-50 rounded-sm animate-bounce-subtle">
                        AI
                      </div>
                    )}
                    
                    <div className={cn(
                      "p-1 border border-slate-800 rounded-2xl group-hover:border-indigo-400 hover:shadow-lg transition-all transform active:scale-95 bg-slate-900 overflow-hidden w-12 h-12 flex items-center justify-center shadow-md",
                      char.type === 'robot' && "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    )}>
                      {char.type === 'robot' ? (
                        <img 
                          src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${char.id}&backgroundColor=b6e3f4`} 
                          alt="Robot" 
                          className="w-full h-full object-cover pixelated"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <img 
                          src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${char.id}&backgroundColor=c0aede`} 
                          alt="NPC" 
                          className="w-full h-full object-cover pixelated"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    
                    {/* Status Indicator */}
                    {char.type === 'user' && (
                      <div className={cn(
                        "absolute -right-1.5 -top-1.5 w-3.5 h-3.5 border border-slate-800 rounded-lg",
                        char.status === 'online' ? "bg-green-500" : "bg-gray-400"
                      )} />
                    )}
                    
                    {/* ID / Name Tag under character */}
                    <div className="mt-1 text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 text-center tracking-tight w-max max-w-[85px] truncate rounded-full absolute left-1/2 -translate-x-1/2 top-full shadow-sm">
                      {char.name || `ID_${char.id.slice(0,6).toUpperCase()}`}
                    </div>

                    {/* Power & SNS Info */}
                    {char.type === 'robot' && (
                      <div className="mt-6 text-[9px] font-semibold bg-slate-900/90 text-slate-200 px-2 py-0.5 border border-slate-800 rounded-full text-center w-max max-w-[95px] absolute left-1/2 -translate-x-1/2 top-full whitespace-nowrap shadow-sm">
                        <span className="text-rose-455 font-bold">P:{(char.totalPower || 0).toLocaleString()}</span>
                        <span className="text-slate-700 mx-0.5">|</span>
                        <span className="text-indigo-400 font-bold">S:{(char.sns || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )})}

              {/* Player character */}
              <motion.div 
                animate={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute flex flex-col items-center pointer-events-none z-20"
              >
                 <div className="relative pointer-events-auto">
                    <div className="p-1 bg-indigo-600 text-white rounded-2xl animate-bounce-subtle w-12 h-12 overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-600/35">
                       {!effectiveUser ? (
                         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-check text-white" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
                       ) : effectiveUser?.photoURL?.startsWith('preset:') ? (
                         <img 
                           src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero-${effectiveUser.photoURL.split(':')[1]}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                           alt="Hero"
                           className="w-full h-full object-cover pixelated"
                         />
                       ) : (
                         <img 
                            src={effectiveUser?.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=Hero&backgroundColor=3b82f6`} 
                            alt="Hero" 
                            className="w-full h-full object-cover pixelated"
                            referrerPolicy="no-referrer"
                         />
                       )}
                    </div>
                 </div>
                 <div className="mt-1 text-xs font-bold bg-indigo-600 text-white px-2.5 py-0.5 text-center tracking-tight w-max rounded-full absolute left-1/2 -translate-x-1/2 top-full shadow-md shadow-indigo-600/20">
                   YOU
                 </div>
              </motion.div>

              {/* Tap Guide Hint */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-955/90 backdrop-blur-md text-white px-4 py-2.5 text-[10px] font-bold rounded-full shadow-lg pointer-events-none tracking-tight uppercase whitespace-nowrap border border-white/5 font-sans">
                üëæ {language === 'ko' ? "AI Î°úÎ¥áÏùÑ ÌÉ≠ÌïòÎ©¥ ÏßÑÏßú ÎçòÏ†Ñ ÎåÄÏ†Ñ ÌïÑÎìúÎ°ú ÏûÖÏû•Ìï©ÎãàÎã§." : "TAP AI ROBOT TO ENTER THE TRUE DUNGEON"}
              </div>
            </div>
          )}
        </div>
      );
    // 2D Field Dungeon map view is discarded.
  }

  const _legacyDungeonView = () => {
    return (
      <div className="flex-1 flex flex-col w-full h-full bg-[#1a1a2e] text-white overflow-hidden relative select-none"
        style={{ backgroundImage: `radial-gradient(circle at 50% 50%, #2a2a4e 0%, #1a1a2e 100%)`, boxShadow: 'inset 0 0 100px rgba(0, 255, 255, 0.25)' }}
      >
        {/* Cyber Grid Overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 95%)'
          }}
        />

        {/* Space Objects - Fixed Top */}
        <div className="absolute top-5 left-[15%] text-4xl opacity-60 animate-pulse">üõ∞Ô∏è</div>
        <div className="absolute top-8 right-[25%] text-5xl opacity-50 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">üöÄ</div>
        <div className="absolute top-12 left-[40%] text-2xl opacity-40">üåå</div>
        <div className="absolute top-6 right-[10%] text-3xl opacity-50 animate-bounce-slow">üõ∞Ô∏è</div>

        {/* Dense Futuristic City Buildings */}
        <div className="absolute top-1/4 left-10 text-7xl opacity-60 select-none pointer-events-none drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">üèôÔ∏è</div>
        <div className="absolute top-1/4 left-32 text-6xl opacity-40 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]">üè¢</div>
        <div className="absolute top-[30%] right-[15%] text-7xl opacity-50 select-none pointer-events-none drop-shadow-[0_0_20px_rgba(255,0,255,0.8)]">üóº</div>

        {/* Header */}
        <header className="h-16 flex items-center justify-between border-b border-white/10 px-6 z-50 bg-black/50 backdrop-blur-md relative shrink-0">
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setIsDungeonActive(false);
              saveDungeonState(false);
            }}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl active:scale-95 transition-all cursor-pointer border border-slate-800 flex items-center gap-1.5 z-50"
          >
            <ArrowLeft size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('back', language)}</span>
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            <ScanLine className="text-[#0ff] animate-pulse" size={20} />
            <h2 className="text-xl font-black italic tracking-tight leading-none uppercase text-center text-[#0ff]">
              {t('mode_dungeon', language)}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/80 border border-[#0ff]/30 rounded-lg shadow-[0_0_10px_rgba(0,255,255,0.15)]">
            <span className="text-xs text-yellow-400 font-black">ü™ô {sns?.toLocaleString()}</span>
          </div>
        </header>

        {/* Dungeon Map Area (Full-screen) */}
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = ((e.clientX - rect.left) / rect.width) * 100;
            const clickY = ((e.clientY - rect.top) / rect.height) * 100;

            const clampedX = Math.max(5, Math.min(95, clickX));
            const clampedY = Math.max(5, Math.min(95, clickY));

            setDungeonTargetPos({ x: clampedX, y: clampedY });
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          }}
          className="flex-1 w-full h-full relative bg-black/40 bg-[radial-gradient(#0ff_1px,transparent_1px)] [background-size:30px_30px] overflow-hidden cursor-crosshair animate-fade-in"
        >
          {/* Guide HUD */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-center pointer-events-none">
            <p className="text-xs md:text-sm font-medium text-[#0ff]/80 leading-relaxed bg-black/80 px-4 py-2.5 border border-[#0ff]/30 rounded-xl shadow-[0_0_15px_rgba(0,255,255,0.1)] text-center max-w-lg">
              {language === 'ko' ? "ÏßÄÎèÑÏùò AI Î™¨Ïä§ÌÑ∞Î•º ÏÑ†ÌÉùÌïòÏó¨ ÌïÑÎìú Ï†ÑÌà¨Î•º ÏãúÏûëÌïòÏÑ∏Ïöî! Î≥¥Ïä§ ÎèôÍµ¥ÏùÑ ÌÅ¥Î¶≠ÌïòÎ©¥ Î≥¥Ïä§ ÎåÄÏ†ÑÏù¥ ÏãúÏûëÎê©ÎãàÎã§." : "Select an AI monster on the map to start a field battle! Tap boss caves to start a boss showdown."}
            </p>
          </div>

          {/* Digital Scanner UI */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none select-none flex flex-col items-center z-10">
            <div className="w-24 h-24 border-2 border-[#0ff] rounded-full flex items-center justify-center relative animate-spin-slow">
              <div className="absolute inset-0 border-t-4 border-[#f0f] rounded-full" />
              <div className="w-1 h-28 bg-[#0ff]/40 absolute" />
              <div className="w-28 h-1 bg-[#0ff]/40 absolute" />
            </div>
            <div className="text-[9px] font-black text-[#0ff] mt-2 tracking-widest uppercase bg-black/60 px-2 py-0.5 rounded">DUNGEON_SCANNER_v1</div>
          </div>

          {/* North Cave */}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer pointer-events-auto z-20"
            style={{ left: '50%', top: '15%' }}
            onClick={(e) => {
              e.stopPropagation();
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              startDungeonBattle(true, 101);
            }}
          >
            <div className="w-14 h-14 bg-purple-900/80 hover:bg-purple-700 border-2 border-purple-500 flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all animate-pulse group-hover:scale-110">
              <Flame size={28} className="text-purple-400" />
            </div>
            <span className="text-[9px] sm:text-xs font-black uppercase text-purple-400 bg-black/85 px-1.5 py-0.5 rounded border border-purple-500 mt-1 whitespace-nowrap">
              ACT 1 BOSS (N)
            </span>
          </div>

          {/* South Cave */}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer pointer-events-auto z-20"
            style={{ left: '50%', top: '85%' }}
            onClick={(e) => {
              e.stopPropagation();
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              startDungeonBattle(true, 102);
            }}
          >
            <div className="w-14 h-14 bg-red-900/80 hover:bg-red-700 border-2 border-red-500 flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all animate-pulse group-hover:scale-110">
              <Flame size={28} className="text-red-400" />
            </div>
            <span className="text-[9px] sm:text-xs font-black uppercase text-red-400 bg-black/85 px-1.5 py-0.5 rounded border border-red-500 mt-1 whitespace-nowrap">
              ACT 2 BOSS (S)
            </span>
          </div>

          {/* West Cave */}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer pointer-events-auto z-20"
            style={{ left: '15%', top: '50%' }}
            onClick={(e) => {
              e.stopPropagation();
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              startDungeonBattle(true, 103);
            }}
          >
            <div className="w-14 h-14 bg-blue-900/80 hover:bg-blue-700 border-2 border-blue-500 flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all animate-pulse group-hover:scale-110">
              <Flame size={28} className="text-blue-400" />
            </div>
            <span className="text-[9px] sm:text-xs font-black uppercase text-blue-400 bg-black/85 px-1.5 py-0.5 rounded border border-blue-500 mt-1 whitespace-nowrap">
              ACT 3 BOSS (W)
            </span>
          </div>

          {/* East Cave */}
          <div
            className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer pointer-events-auto z-20"
            style={{ left: '85%', top: '50%' }}
            onClick={(e) => {
              e.stopPropagation();
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              startDungeonBattle(true, 104);
            }}
          >
            <div className="w-14 h-14 bg-emerald-900/80 hover:bg-emerald-700 border-2 border-emerald-500 flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all animate-pulse group-hover:scale-110">
              <Flame size={28} className="text-emerald-400" />
            </div>
            <span className="text-[9px] sm:text-xs font-black uppercase text-emerald-400 bg-black/85 px-1.5 py-0.5 rounded border border-emerald-500 mt-1 whitespace-nowrap">
              ACT 4 BOSS (E)
            </span>
          </div>

          {/* Roaming AI Monsters */}
          {dungeonMonsters.map((monster) => {
            return (
              <div
                key={monster.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-60 select-none pointer-events-auto cursor-pointer group z-20"
                style={{
                  left: `${monster.x}%`,
                  top: `${monster.y}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  startDungeonBattle(false, monster.cardId);
                }}
              >
                <div className="w-10 h-10 bg-red-950 border-2 border-red-600 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.7)] group-hover:scale-125 group-hover:bg-red-900 transition-all">
                  <Bot size={20} className="text-red-400 animate-bounce" />
                </div>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-1 py-0.5 rounded-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  AI
                </div>
              </div>
            );
          })}

          {/* Player Character */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-60 select-none pointer-events-none z-20"
            style={{
              left: `${dungeonPlayerPos.x}%`,
              top: `${dungeonPlayerPos.y}%`,
            }}
          >
            <div className="w-10 h-10 bg-blue-950 border-2 border-blue-500 rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.9)] animate-pulse">
              <Swords size={20} className="text-blue-400" />
            </div>
          </div>

          {/* Tap target indicator */}
          {dungeonTargetPos && (
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-yellow-400 rounded-full animate-ping pointer-events-none z-20"
              style={{ left: `${dungeonTargetPos.x}%`, top: `${dungeonTargetPos.y}%` }}
            />
          )}
          {renderCustomAlertModal()}
        </div>
      </div>
    );
  }

  if (gameState === 'boss') {
    const BossCardItem = ({ boss }: { boss: { id: number; reward: number }; key?: number }) => {
      const bossCard = CARD_DATABASE[boss.id];
      const [timeLeft, setTimeLeft] = useState<number>(0);

      useEffect(() => {
        const checkCooldown = () => {
          const cooldowns = JSON.parse(localStorage.getItem('hero_boss_cooldowns') || '{}');
          const lastKilled = cooldowns[boss.id] || 0;
          const now = Date.now();
          const tenHours = 10 * 60 * 60 * 1000;
          const diff = tenHours - (now - lastKilled);
          setTimeLeft(diff > 0 ? diff : 0);
        };

        checkCooldown();
        const interval = setInterval(checkCooldown, 1000);
        return () => clearInterval(interval);
      }, [boss.id]);

      if (!bossCard) return null;

      const isCooldown = timeLeft > 0;
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

      return (
        <motion.div
          whileHover={!isCooldown ? { y: -6, scale: 1.02 } : {}}
          className={cn(
            "flex flex-col rounded-3xl border bg-slate-900 overflow-hidden shadow-xl transition-all relative",
            isCooldown ? "border-slate-800 opacity-70" : "border-purple-600/30 hover:border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.05)] hover:shadow-[0_0_30px_rgba(147,51,234,0.15)]"
          )}
        >
          {/* Reward Tag */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-md z-10 animate-pulse">
            +{boss.reward} SNS
          </div>

          {/* Boss Card Display */}
          <div className="h-64 bg-slate-950 relative border-b border-slate-800 flex items-center justify-center p-4">
            <CardItem 
              card={{
                ...bossCard,
                id: `boss-preview-${boss.id}`,
                owner: 'ai',
                bonusPower: 0,
                xp: 0,
                imageIndex: boss.id,
                isFinalBoss: true
              }} 
              isLocked={true} 
              className="w-40 h-56"
              lowSpecMode={lowSpecMode}
              language={language}
            />
            {isCooldown && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-55">
                <ShieldAlert size={40} className="text-red-500 animate-bounce mb-2" />
                <span className="text-xs font-black text-red-500 uppercase tracking-widest bg-red-950/80 px-2.5 py-1 border border-red-500 rounded-md">
                  COOLDOWN (Ìú¥Ïãù Ï§ë)
                </span>
                <span className="text-sm font-bold mt-2 text-gray-300">
                  {hours}h {minutes}m {seconds}s
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-5 flex-1 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-black italic tracking-wide text-white uppercase truncate">
                  {language === 'ko' ? bossCard.title : (bossCard.title_dis || bossCard.title_en)}
                </h3>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {language === 'ko' ? bossCard.desc : (bossCard.desc_dis || bossCard.desc_en)}
              </p>
            </div>

            <button
              disabled={isCooldown}
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                startBossMatch(boss.id);
              }}
              className={cn(
                "w-full py-3 font-black uppercase italic tracking-wider rounded-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-md",
                isCooldown 
                  ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/20"
              )}
            >
              {isCooldown ? "WAITING..." : "CHALLENGE (ÎåÄÍ≤∞ÌïòÍ∏∞)"}
            </button>
          </div>
        </motion.div>
      );
    };

    return (
      <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[#1a1a2e] text-white overflow-y-auto relative pb-20"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #2a2a4e 0%, #1a1a2e 100%)`,
          boxShadow: 'inset 0 0 100px rgba(0, 255, 255, 0.25)'
        }}
      >
        {/* Cyber Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0" 
             style={{ 
               backgroundImage: `linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)`,
               backgroundSize: '80px 80px',
               maskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 95%)'
             }} 
        />

        {/* Header */}
        <header className="h-16 flex items-center justify-between border-b border-white/10 px-6 bg-slate-950/80 backdrop-blur-md z-50 shrink-0 relative font-sans">
          <div className="w-10" />
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            <h2 className="text-xl font-black italic tracking-tight leading-none uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#0ff] text-center">
              {t('mode_boss', language)}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 border border-white/10 rounded-lg shadow-sm">
            <span className="text-xs text-yellow-400 font-black">ü™ô {sns?.toLocaleString()}</span>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-start max-w-5xl mx-auto w-full gap-6 touch-auto z-10">
          <div className="w-full text-center max-w-xl">
            <p className="text-xs md:text-sm font-medium text-slate-350 leading-relaxed bg-slate-900/80 backdrop-blur-md px-4 py-3.5 border border-white/10 rounded-2xl shadow-lg">
              {language === 'ko' 
                ? "Ïä§ÌÜ†Î¶¨ ÎåÄÏ†ÑÏóêÏÑú Ï≤òÏπòÌñàÎçò Î≥¥Ïä§Îì§Í≥º 1ÎåÄ1 Ïπ¥Îìú ÎåÄÏ†ÑÏùÑ ÌéºÏπ©ÎãàÎã§. Í∞Å Î≥¥Ïä§Îäî 10ÏãúÍ∞ÑÏóê 1ÌöåÎßå Ï≤òÏπòÌï† Ïàò ÏûàÏúºÎÇò, ÌôïÏã§Ìïú ÎåÄÎüâ Î≥¥ÏÉÅÏùÑ ÌöçÎìùÌï† Ïàò ÏûàÏäµÎãàÎã§!" 
                : "Duel 1-on-1 with bosses from the Story Mode. Each boss can be defeated once every 10 hours, but guarantees massive rewards!"}
            </p>
          </div>

          {/* Boss Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full py-4">
            {bossList.map((boss) => (
              <BossCardItem key={boss.id} boss={boss} />
            ))}
          </div>
        </main>
        {renderCustomAlertModal()}
      </div>
    );
  }



  if (gameState === 'story') {
    const actInfo = storyActData[storyAct];
    const isIntro = storyStep === 0;
    const isClimax = storyStep === 3;
    const isMidTaunt = storyStep === 1;
    const isFinalTaunt = storyStep === 2;

    const currentBossId = isMidTaunt ? actInfo.midBossId : actInfo.finalBossId;
    const currentBossCard = CARD_DATABASE[currentBossId];

    return (
      <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[#1a1a2e] text-white overflow-y-auto relative pb-20 select-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #2a2a4e 0%, #1a1a2e 100%)`,
          boxShadow: 'inset 0 0 100px rgba(0, 255, 255, 0.25)'
        }}
      >
        {/* Cyber Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0" 
             style={{ 
               backgroundImage: `linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)`,
               backgroundSize: '80px 80px',
               maskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 95%)'
             }} 
        />

        {/* Header */}
        <header className="h-16 flex items-center justify-between border-b border-white/10 px-6 bg-slate-950/80 backdrop-blur-md z-50 shrink-0 relative font-sans">
          <div className="w-10" />
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            <h2 className="text-xl font-black italic tracking-tight leading-none uppercase text-center text-white">{t('story_title', language)}</h2>
          </div>
          <div className="w-10" />
        </header>

        {/* Narrative Banner with Skip and Auto Controls */}
        <div className="shrink-0 bg-slate-950/60 text-indigo-400 py-2.5 px-4 sm:px-6 text-center font-black italic uppercase tracking-widest text-xs border-b border-white/10 flex justify-between items-center shadow-md backdrop-blur-md z-10 gap-2">
          <div className="flex items-center gap-2">
            <span>{t('story_act_prefix', language).replace('{act}', String(storyAct + 1))}</span>
            <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
              {isIntro ? t('story_step_intro', language) : isClimax ? t('story_step_climax', language) : "BOSS FIGHT"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Play Toggle */}
            <button
              type="button"
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setIsStoryAutoPlay(!isStoryAutoPlay);
              }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border touch-target",
                isStoryAutoPlay
                  ? "bg-amber-500 text-black border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
              )}
            >
              <Play size={12} className={cn(isStoryAutoPlay && "fill-black")} />
              <span>{isStoryAutoPlay ? t('story_btn_auto_stop', language) : t('story_btn_auto', language)}</span>
            </button>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkipStory}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400 shadow-sm transition-all cursor-pointer active:scale-95 touch-target"
            >
              <FastForward size={12} />
              <span>{t('story_btn_skip', language)}</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full gap-6 z-10">
          <AnimatePresence mode="wait">
            {(isIntro || isClimax) && (
              <motion.div
                key={`story-narration-${storyAct}-${storyStep}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full flex flex-col items-center gap-6 text-center"
              >
                {/* Visual Boss Card Preview */}
                <div className="w-40 h-56 shrink-0 shadow-[0_15px_30px_rgba(0,0,0,0.5)] border border-slate-800 rounded-3xl overflow-hidden active:scale-95 transition-transform duration-200">
                  <CardItem 
                    card={{
                      ...CARD_DATABASE[isIntro ? actInfo.midBossId : actInfo.finalBossId],
                      id: `preview-${isIntro ? actInfo.midBossId : actInfo.finalBossId}`,
                      owner: 'ai',
                      bonusPower: 0,
                      xp: 0,
                      imageIndex: isIntro ? actInfo.midBossId : actInfo.finalBossId,
                      isMidBoss: isIntro,
                      isFinalBoss: !isIntro
                    }} 
                    isLocked={true} 
                    className="w-full h-full"
                    lowSpecMode={lowSpecMode}
                    language={language}
                  />
                </div>

                {/* Narrative Text Box */}
                <div className="border border-indigo-500/20 p-6 rounded-3xl bg-slate-900/90 backdrop-blur-md shadow-[0_0_25px_rgba(99,102,241,0.05)] space-y-4 text-left">
                  <h3 className="text-xl font-black italic uppercase tracking-tight text-indigo-400">
                    {isIntro ? actInfo.title : `${t('story_step_climax', language)}: ${actInfo.title.split(': ')[1]}`}
                  </h3>
                  <p className="text-sm font-bold text-gray-300 leading-relaxed text-left whitespace-pre-line font-sans">
                    {isIntro ? actInfo.desc : actInfo.climax}
                  </p>
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    if (isIntro) {
                      const nextStep = 1;
                      setStoryStep(nextStep);
                      saveStoryProgress(storyAct, nextStep, true);
                    } else {
                      if (storyAct === 3) {
                        setIsStoryFinished(true);
                      } else {
                        const nextAct = storyAct + 1;
                        setStoryAct(nextAct);
                        setStoryStep(0);
                        saveStoryProgress(nextAct, 0, true);
                      }
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black uppercase italic tracking-wider rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isIntro ? t('story_btn_challenge', language) : (storyAct === 3 ? t('story_btn_finish', language) : t('story_btn_next_act', language))}</span>
                </button>
              </motion.div>
            )}

            {(isMidTaunt || isFinalTaunt) && currentBossCard && (
              <motion.div
                key={`story-taunt-${storyAct}-${storyStep}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center gap-6"
              >
                {/* Taunting Dialogue Bubble */}
                <div className="w-full relative bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl font-bold text-center text-sm md:text-base">
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-t-[12px] border-t-slate-800 border-x-[12px] border-x-transparent" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-t-[10px] border-t-slate-900 border-x-[10px] border-x-transparent z-10 -mt-0.5" />
                  
                  <span className="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">
                    [ {isMidTaunt ? "MID BOSS TAUNT" : "FINAL BOSS TAUNT"} ]
                  </span>
                  <p className="italic text-slate-200 font-sans font-extrabold leading-relaxed">
                    "{isMidTaunt ? actInfo.midBossTaunt : actInfo.finalBossTaunt}"
                  </p>
                </div>

                {/* Boss Avatar Image */}
                <div className="flex flex-col items-center gap-2 mt-2">
                  <div className="w-32 h-44 shrink-0 shadow-[0_10px_25px_rgba(0,0,0,0.3)] border border-slate-800 rounded-2xl overflow-hidden relative">
                    <CardItem 
                      card={{
                        ...currentBossCard,
                        id: `boss-${currentBossId}`,
                        owner: 'ai',
                        bonusPower: 0,
                        xp: 0,
                        imageIndex: currentBossId,
                        isMidBoss: isMidTaunt,
                        isFinalBoss: isFinalTaunt
                      }} 
                      isLocked={true} 
                      className="w-full h-full"
                      lowSpecMode={lowSpecMode}
                      language={language}
                    />
                  </div>
                  <span className="bg-slate-950 text-white px-3 py-1 text-xs font-black uppercase tracking-wider rounded border border-slate-800 shadow-md">
                    {language === 'ko' ? currentBossCard.title : (currentBossCard.title_dis || currentBossCard.title_en)}
                  </span>
                </div>

                {/* Start Match Button */}
                <button
                  onClick={() => startStoryMatch(currentBossId, isFinalTaunt)}
                  className="w-full max-w-sm py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black uppercase italic tracking-wider rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <Swords size={20} />
                  <span>{winner === 'ai' ? t('story_btn_retry', language) : t('match_start', language)}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Clear Act Reward Modal */}
        <AnimatePresence>
          {showStoryResultModal && (() => {
            // 1, 2Îßâ Akira Ïπ¥Îìú (id 64)
            const akiraCardData: CardData = {
              id: 'story-akira',
              title: CARD_DATABASE[64]?.title || 'ÏóòÌîÑÍµ∞Ï£º',
              title_en: CARD_DATABASE[64]?.title_en || 'Elf Lord',
              title_dis: CARD_DATABASE[64]?.title_dis || 'Elf Lord',
              stats: [...(CARD_DATABASE[64]?.stats || [7, 2, 3, 5])] as [number, number, number, number],
              rarity: CARD_DATABASE[64]?.rarity || 'bronze',
              level: 1,
              imageIndex: 64,
              owner: null
            };

            // 3, 4Îßâ Charsi Ïπ¥Îìú (id 79)
            const charsiCardData: CardData = {
              id: 'story-charsi',
              title: CARD_DATABASE[79]?.title || 'Ïä§Ìä∏Î°úÎ≤†Î¶¨',
              title_en: CARD_DATABASE[79]?.title_en || 'Strawberry',
              title_dis: CARD_DATABASE[79]?.title_dis || 'Strawberry',
              stats: [...(CARD_DATABASE[79]?.stats || [5, 1, 9, 9])] as [number, number, number, number],
              rarity: CARD_DATABASE[79]?.rarity || 'gold',
              level: 1,
              imageIndex: 79,
              owner: null
            };

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-slate-900 text-white w-full max-w-md rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 relative flex flex-col z-[1001]"
                >
                  <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-slate-800 text-white flex items-center gap-2">
                    <Sparkles size={24} className="text-yellow-300 animate-spin" />
                    <h2 className="text-lg font-black italic uppercase tracking-tight">{t('story_reward_earned', language)}</h2>
                  </div>

                  <div className="p-6 space-y-4 text-center flex flex-col">
                    <h3 className="text-2xl font-black italic leading-tight pt-2 px-2 text-white">
                      {t('story_act_prefix', language).replace('{act}', String(storyAct + 1))} {language === 'ko' ? "ÌÅ¥Î¶¨Ïñ¥!" : "Cleared!"}
                    </h3>

                    {/* Character Card Visual and Speech Message */}
                    <div className="flex flex-col items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-inner">
                      <div className="w-20 h-28 flex-shrink-0">
                        <CardItem 
                          card={storyAct === 0 || storyAct === 1 ? akiraCardData : charsiCardData} 
                          className="w-full h-full pointer-events-none scale-100" 
                          language={language}
                        />
                      </div>
                      <div className="text-[11px] font-black leading-relaxed text-left text-slate-200 bg-slate-900 p-3 border border-slate-800 rounded-xl relative shadow-md w-full">
                        {/* Speech Bubble Arrow Decoration */}
                        <div className="absolute top-[-7px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-t border-l border-slate-800 rotate-45" />
                        <p className="relative z-10 text-center text-slate-300">
                          "{t(storyAct === 0 || storyAct === 1 ? 'story_akira_congratulations' : 'story_charsi_congratulations', language)}"
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner text-center flex flex-col justify-center items-center">
                        <span className="text-[9px] font-bold uppercase opacity-60 block mb-0.5 text-slate-400">{t('reward', language)}</span>
                        <span className="text-lg font-black text-indigo-400">+{storyReward} SNS</span>
                      </div>

                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner text-center flex flex-col justify-center items-center">
                        <span className="text-[9px] font-bold uppercase opacity-60 block mb-0.5 text-slate-400">
                          {storyAct === 0 || storyAct === 1 ? (language === 'ko' ? "Ï∂îÍ∞Ä Î≥¥ÏÉÅ" : "BONUS") : (language === 'ko' ? "ÌöçÎìù ÏïÑÏù¥ÌÖú" : "ITEM")}
                        </span>
                        {storyAct === 0 || storyAct === 1 ? (
                          <span className="text-sm font-black italic text-purple-400">
                            +1 {language === 'ko' ? "Ïä§ÌÇ¨Ìè¨Ïù∏Ìä∏" : "Skill Point"}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="text-base text-purple-400 leading-none">
                              {storyBonusItem?.emoji || 'üõ°Ô∏è'}
                            </span>
                            <span className="text-[10px] font-black text-purple-400 truncate max-w-[80px]">
                              {language === 'ko' ? storyBonusItem?.name_ko : storyBonusItem?.name_en}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 border-t border-slate-800 bg-slate-950 flex justify-center">
                    <button
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        claimStoryBattleReward(`story-reward-${storyAct}`);
                        setShowStoryResultModal(false);
                      }}
                      className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-450 hover:to-yellow-450 text-slate-900 font-bold uppercase rounded-2xl shadow-lg shadow-yellow-500/10 active:scale-98 transition-all cursor-pointer text-center"
                    >
                      {t('tournament_confirm_btn', language)}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Global End Story Finished Modal */}
        <AnimatePresence>
          {isStoryFinished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 text-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 relative flex flex-col z-[1001]"
              >
                <div className="p-6 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 border-b border-slate-800 text-slate-950 flex items-center gap-2">
                  <Trophy size={28} className="animate-bounce text-slate-950" />
                  <h2 className="text-xl font-black italic uppercase tracking-tight text-slate-950">THE END</h2>
                </div>

                <div className="p-8 space-y-6 text-center bg-slate-900">
                  <div className="w-24 h-24 bg-yellow-100/10 rounded-full border border-slate-800 flex items-center justify-center mx-auto shadow-lg text-yellow-400 animate-spin animate-duration-3000">
                    <Trophy size={48} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">ÏõÖÏû•Ìïú ÏÑúÏÇ¨Ïùò ÎßàÎ¨¥Î¶¨</h3>
                    <p className="text-xs font-bold text-slate-350 leading-relaxed font-sans px-2 pt-2">
                      {language === 'ko' 
                        ? 'Ï≤úÏÉÅÍ≥ÑÏôÄÏùò ÏúÑÎåÄÌïú Í≤∞Ï†Ñ ÎÅùÏóê Ïù∏Î•òÏôÄ Î™®Îì† ÌîºÏ°∞Î¨ºÎì§ÏùÄ ÎßàÏπ®ÎÇ¥ ÌèâÌôîÎ•º ÎßûÏù¥ÌñàÏäµÎãàÎã§. Ïù¥Ï†ú Í∑∏Îì§ÏùÑ Ï¥àÏõîÌïú ÏÉàÎ°úÏö¥ ÏãúÎåÄÍ∞Ä ÏãúÏûëÎê©ÎãàÎã§. ÏòÅÏõÖÏù¥Ïó¨, ÏàòÍ≥†ÌïòÏÖ®ÏäµÎãàÎã§!'
                        : 'After the final battle, humanity and all creatures have achieved eternal peace. A new era transcending the cosmos has begun. Thank you, Hero!'}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner inline-block">
                    <span className="text-[10px] font-black uppercase opacity-60 block mb-1 text-slate-400">TOTAL CLEAR PRIZE</span>
                    <span className="text-3xl font-black italic text-yellow-400">+300 SNS</span>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-center">
                  <button
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      recordMatchResult('win', 300, undefined, 'robot');
                      saveStoryProgress(0, 0, false);
                      setStoryAct(0);
                      setStoryStep(0);
                      setIsStoryFinished(false);
                      setIsStoryActive(false);
                      setGameState('modeSelect');
                    }}
                    className="w-full py-5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-450 hover:to-yellow-450 text-slate-955 font-black uppercase italic tracking-widest rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {t('story_btn_finish', language)}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {renderCustomAlertModal()}
      </div>
    );
  }

  if (gameState === 'tournament') {
    return (
      <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[#1a1a2e] text-white overflow-y-auto relative pb-24 select-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #2a2a4e 0%, #1a1a2e 100%)`,
          boxShadow: 'inset 0 0 100px rgba(0, 255, 255, 0.15)'
        }}
      >
        {/* Cyber Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0" 
             style={{ 
               backgroundImage: `linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)`,
               backgroundSize: '80px 80px',
               maskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 95%)'
             }} 
        />

        {/* Header */}
        <PageHeader 
          title={t('tournament_title', language)} 
          dark={true}
          onBack={() => {
            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            if (!isPlayerEliminated && !isPlayerWinner) {
              setConfirmModal({
                isOpen: true,
                title: language === 'ko' ? 'ÌÜ†ÎÑàÎ®ºÌä∏ Ìè¨Í∏∞' : 'FORFEIT TOURNAMENT',
                message: language === 'ko' ? 'Ï†ïÎßê ÏßÑÌñâ Ï§ëÏù∏ ÌÜ†ÎÑàÎ®ºÌä∏Î•º Ìè¨Í∏∞ÌïòÏãúÍ≤†ÏäµÎãàÍπå?' : 'Do you really want to forfeit this tournament?',
                onConfirm: () => {
                  setIsTournamentActive(false);
                  setGameState('modeSelect');
                }
              });
            } else {
              setIsTournamentActive(false);
              setGameState('modeSelect');
            }
          }}
        />

        {/* Round Tab Selectors (Highlights current active round tab) */}
        <div className="shrink-0 flex justify-center gap-1.5 md:gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-950/40 backdrop-blur-md overflow-x-auto scrollbar-hide shadow-xs z-10">
          {[0, 1, 2, 3].map((rIdx) => {
            const roundLabels = [
              t('tournament_round_16', language),
              t('tournament_round_8', language),
              t('tournament_round_4', language),
              t('tournament_round_2', language)
            ];
            const isSelectable = rIdx <= tournamentRound || (tournamentRounds[rIdx] && tournamentRounds[rIdx].some(m => m.p1 !== null || m.p2 !== null));
            return (
              <button
                key={rIdx}
                disabled={!isSelectable}
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setActiveTournamentTab(rIdx);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-black uppercase italic tracking-wider border transition-all rounded-lg select-none cursor-pointer hover:scale-[1.02] active:scale-[0.98] z-10",
                  activeTournamentTab === rIdx
                    ? "bg-[#0ff]/10 text-[#0ff] border-[#0ff]/80 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
                    : isSelectable
                      ? "bg-slate-950/80 text-slate-300 border-white/10 hover:border-[#0ff]/50 hover:bg-slate-900/60 shadow-sm"
                      : "bg-slate-950/30 text-slate-600 border-white/5 cursor-not-allowed opacity-45"
                )}
              >
                {roundLabels[rIdx]}
              </button>
            );
          })}
        </div>

        {/* Visual Bracket Grid (Tree layout) */}
        <main className="flex-1 w-full overflow-x-auto p-4 md:p-6 bg-slate-950/40 touch-auto select-none z-10">
          <AnimatePresence>
            {justAdvanced && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              >
                <div className="bg-gradient-to-r from-amber-400 to-yellow-400 border border-amber-300 px-8 py-4 rounded-2xl shadow-xl text-slate-950 font-black text-2xl uppercase italic tracking-widest text-center animate-bounce">
                  üöÄ {language === 'ko' ? "Îã§Ïùå ÎùºÏö¥Îìú ÏßÑÏ∂ú!" : "ADVANCED!"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-row gap-6 md:gap-10 justify-start items-stretch min-w-[900px] max-w-7xl mx-auto py-4">
            {[0, 1, 2, 3].map((roundIdx) => {
              const roundLabels = [
                t('tournament_round_16', language),
                t('tournament_round_8', language),
                t('tournament_round_4', language),
                t('tournament_round_2', language)
              ];
              const matches = tournamentRounds[roundIdx] || [];
              const isActiveRoundCol = roundIdx === tournamentRound;
              const isSelectedRoundCol = roundIdx === activeTournamentTab;

              return (
                <div 
                  key={roundIdx} 
                  className={cn(
                    "flex-1 flex flex-col justify-around gap-4 min-h-[600px] p-2 rounded-2xl transition-all duration-300",
                    isSelectedRoundCol ? "bg-[#0ff]/5 border-2 border-[#0ff]/20 shadow-[0_0_20px_rgba(0,255,255,0.05)]" : "border-2 border-transparent"
                  )}
                >
                  {/* Round Column Header */}
                  <div className="text-center shrink-0 border-b border-white/10 pb-2 mb-2 flex flex-col items-center gap-1.5">
                    <h3 className={cn(
                      "text-xs md:text-sm font-black uppercase italic tracking-wider",
                      isActiveRoundCol ? "text-[#f0f] animate-pulse" : "text-white"
                    )}>
                      {roundLabels[roundIdx]}
                    </h3>
                    {isActiveRoundCol && (
                      <span className="text-[8px] bg-rose-955/80 text-rose-400 px-1 py-0.5 rounded border border-rose-500/50 font-bold shrink-0 leading-none">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Matches Column */}
                  <div className="flex-1 flex flex-col justify-around gap-4 py-2">
                    {matches.map((m, idx) => {
                      const hasPlayer = m.p1?.isPlayer || m.p2?.isPlayer;
                      const isMatchFinished = m.winner !== null;
                      const isPlayerMatchToPlay = hasPlayer && !isMatchFinished && isActiveRoundCol;

                      return (
                        <motion.div
                          key={`match-${roundIdx}-${idx}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className={cn(
                            "border border-white/10 p-3 rounded-2xl bg-slate-900/90 shadow-xl flex flex-col gap-2 relative overflow-hidden transition-all duration-300 w-44 md:w-52 mx-auto shrink-0",
                            isPlayerMatchToPlay && "ring-4 ring-yellow-500/50 bg-slate-900 scale-105 z-10 shadow-[0_0_25px_rgba(234,179,8,0.2)]",
                            isActiveRoundCol && !isPlayerMatchToPlay && "border-slate-700 opacity-90",
                            !isActiveRoundCol && "opacity-60"
                          )}
                        >
                          {isPlayerMatchToPlay && (
                            <div className="absolute top-1 right-1 bg-rose-600 text-white text-[7px] font-bold uppercase px-2 py-0.5 rounded-full animate-pulse z-10">
                              PLAY
                            </div>
                          )}

                          {/* Participant 1 */}
                          <div className={cn(
                            "flex items-center gap-1.5 p-1 rounded-lg border border-white/5 bg-slate-950/60 text-[10px] md:text-xs min-w-0",
                            m.winner?.id === m.p1?.id && isMatchFinished && "bg-emerald-950/40 border-emerald-500/50 font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                            m.winner && m.winner.id !== m.p1?.id && "opacity-30 grayscale"
                          )}>
                            <div className="w-5 h-5 rounded bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                              {m.p1?.isPlayer ? <User size={10} className="text-cyan-400" /> : <Bot size={10} className="text-rose-400" />}
                            </div>
                            <span className={cn("truncate flex-1 font-mono text-slate-350", m.p1?.isPlayer && "text-cyan-400 font-bold underline")}>
                              {m.p1?.name || 'TBD'}
                            </span>
                            {isMatchFinished && m.p1 && (
                              <span className="font-bold text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-white/10 text-slate-300 shrink-0">
                                {m.score1 ?? 0}
                              </span>
                            )}
                          </div>

                          {/* Participant 2 */}
                          <div className={cn(
                            "flex items-center gap-1.5 p-1 rounded-lg border border-white/5 bg-slate-950/60 text-[10px] md:text-xs min-w-0",
                            m.winner?.id === m.p2?.id && isMatchFinished && "bg-emerald-950/40 border-emerald-500/50 font-bold text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
                            m.winner && m.winner.id !== m.p2?.id && "opacity-30 grayscale"
                          )}>
                            <div className="w-5 h-5 rounded bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                              {m.p2?.isPlayer ? <User size={10} className="text-cyan-400" /> : <Bot size={10} className="text-rose-400" />}
                            </div>
                            <span className={cn("truncate flex-1 font-mono text-slate-350", m.p2?.isPlayer && "text-cyan-400 font-bold underline")}>
                              {m.p2?.name || 'TBD'}
                            </span>
                            {isMatchFinished && m.p2 && (
                              <span className="font-bold text-[9px] bg-slate-900 px-1.5 py-0.5 rounded border border-white/10 text-slate-300 shrink-0">
                                {m.score2 ?? 0}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Start button for Active Match */}
        {!isPlayerEliminated && !isPlayerWinner && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-40">
            <button
              onClick={startTournamentMatch}
              className="w-full py-4 bg-gradient-to-r from-yellow-450 to-amber-500 text-amber-955 font-bold uppercase rounded-2xl shadow-lg shadow-yellow-200/40 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords size={20} />
              <span>{tournamentRound === 0 ? t('tournament_start', language) : t('tournament_next_match', language)}</span>
            </button>
          </div>
        )}

        {/* Final Results Summary Modal */}
        <AnimatePresence>
          {showTournamentResultModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-900 text-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative flex flex-col z-[1001]"
              >
                <div className={cn(
                  "p-5 border-b border-slate-800 text-white flex items-center gap-2 justify-between",
                  isPlayerWinner ? "bg-gradient-to-r from-yellow-450 to-amber-500 text-amber-955" : "bg-gradient-to-r from-rose-600 to-red-650 text-white"
                )}>
                  <div className="flex items-center gap-2">
                    {isPlayerWinner ? <Trophy size={24} className="text-amber-955" /> : <ShieldAlert size={24} className="text-white" />}
                    <h2 className={cn("text-lg font-extrabold tracking-tight uppercase", isPlayerWinner ? "text-amber-955" : "text-white")}>
                      {t('tournament_over_title', language)}
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-4 text-center">
                  <div className={cn(
                    "w-20 h-20 rounded-full border border-slate-800 flex items-center justify-center mx-auto shadow-inner",
                    isPlayerWinner ? "bg-amber-100 text-yellow-600 animate-bounce shadow-[0_0_15px_rgba(234,179,8,0.3)]" : "bg-rose-100 text-rose-600"
                  )}>
                    {isPlayerWinner ? <Trophy size={36} /> : <Activity size={36} />}
                  </div>

                  <h3 className="text-2xl font-black italic leading-tight pt-2 px-2">
                    {isPlayerWinner 
                      ? t('tournament_summary_win', language)
                      : t('tournament_summary_lose', language).replace(
                          '{round}', 
                          tournamentRound === 0 ? t('tournament_round_16', language) :
                          tournamentRound === 1 ? t('tournament_round_8', language) :
                          tournamentRound === 2 ? t('tournament_round_4', language) :
                          t('tournament_round_2', language)
                        )
                    }
                  </h3>

                  <div className="p-4.5 bg-slate-950 border border-slate-800 rounded-3xl shadow-inner inline-block">
                    <span className="text-xs font-black uppercase opacity-60 block mb-1 text-slate-400">{t('tournament_prize', language)}</span>
                    <span className="text-2xl font-black italic text-yellow-400">+{tournamentPrize} SNS</span>
                  </div>
                </div>

                <div className="p-5 border-t-2 border-slate-800 bg-slate-950 flex justify-center">
                  <button
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setShowTournamentResultModal(false);
                      setIsTournamentActive(false);
                      setGameState('modeSelect');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-450 hover:to-yellow-450 text-slate-900 font-bold uppercase rounded-2xl shadow-lg active:scale-98 transition-all cursor-pointer text-center"
                  >
                    {t('tournament_confirm_btn', language)}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {confirmModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            >
              <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              />
              <motion.div
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="bg-slate-950 text-slate-100 w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.15)] border border-slate-800 relative z-[10000] font-sans"
              >
                <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-955 border-b border-slate-800 text-white flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} className="text-yellow-400 animate-pulse" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-wide">{confirmModal.title}</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm font-bold text-slate-350 leading-relaxed whitespace-pre-line">{confirmModal.message}</p>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer text-center"
                  >
                    {language === 'ko' ? 'Ï∑®ÏÜå' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-xs tracking-wider rounded-xl shadow-md transition-all cursor-pointer text-center"
                  >
                    {language === 'ko' ? 'ÌôïÏù∏' : 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {renderCustomAlertModal()}
      </div>
    );
  }

  if (gameState === 'shooting') {
    return (
      <ShootingBattleGame
        deck={playerDeck}
        language={language}
        playerName={effectiveUser?.displayName || effectiveUser?.name || 'YOU'}
        lowSpecMode={lowSpecMode}
        currentSeason={currentSeason}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'ÏäàÌåÖÎåÄÏ†Ñ Î≥¥ÏÉÅ', 'Shooting Battle reward')}
      />
    );
  }

  if (gameState === 'snake') {
    return (
      <SnakeBattleGame
        deck={playerDeck}
        language={language}
        playerName={effectiveUser?.displayName || effectiveUser?.name || 'YOU'}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïä§ÎÑ§Ïù¥ÌÅ¨ÎåÄÏ†Ñ Î≥¥ÏÉÅ', 'Snake Battle reward')}
      />
    );
  }

  if (gameState === 'gomoku') {
    return (
      <GomokuGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïò§Î™© Î≥¥ÏÉÅ', 'Gomoku reward')}
      />
    );
  }

  if (gameState === 'memorymatch') {
    return (
      <MemoryMatchGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥Îìú ÏßùÎßûÏ∂îÍ∏∞ Î≥¥ÏÉÅ', 'Memory Match reward')}
      />
    );
  }

  if (gameState === 'slide2048') {
    return (
      <Slide2048Game
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, '2048 Î≥¥ÏÉÅ', '2048 reward')}
      />
    );
  }

  if (gameState === 'cardjumper') {
    return (
      <CardJumperGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥ÎìúÏ†êÌîÑ Î≥¥ÏÉÅ', 'Card Jumper reward')}
      />
    );
  }

  if (gameState === 'cardtap') {
    return (
      <CardTapGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥ÎìúÌÉ≠ Î≥¥ÏÉÅ', 'Card Tap reward')}
      />
    );
  }

  if (gameState === 'cardflip') {
    return (
      <CardFlipGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥ÎìúÌîåÎ¶Ω Î≥¥ÏÉÅ', 'Card Flip reward')}
      />
    );
  }

  if (gameState === 'cardslide') {
    return (
      <CardSlidePuzzleGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥ÎìúÏä¨ÎùºÏù¥Îìú Î≥¥ÏÉÅ', 'Card Slide reward')}
      />
    );
  }

  if (gameState === 'cardsorcery') {
    return (
      <CardSorceryGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥ÎìúÏÜåÏÑúÎ¶¨ Î≥¥ÏÉÅ', 'Card Sorcery reward')}
      />
    );
  }

  if (gameState === 'cardslot') {
    return (
      <CardSlotGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥ÎìúÏä¨Î°Ø Î≥¥ÏÉÅ', 'Card Slot reward')}
      />
    );
  }

  if (gameState === 'cardheist') {
    return (
      <CardHeistGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥Îìú ÌïòÏù¥Ïä§Ìä∏ Î≥¥ÏÉÅ', 'Card Heist reward')}
      />
    );
  }

  if (gameState === 'cardrush') {
    return (
      <CardRushGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ïπ¥Îìú Îü¨Ïãú Î≥¥ÏÉÅ', 'Card Rush reward')}
      />
    );
  }

  if (gameState === 'breakout') {
    return (
      <BreakoutGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î≤ΩÎèåÍπ®Í∏∞ Î≥¥ÏÉÅ', 'Breakout reward')}
      />
    );
  }

  if (gameState === 'minesweeper') {
    return (
      <MinesweeperGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'ÏßÄÎ¢∞Ï∞æÍ∏∞ Î≥¥ÏÉÅ', 'Minesweeper reward')}
      />
    );
  }

  if (gameState === 'pacman') {
    return (
      <PacmanGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ìå©Îß® Î≥¥ÏÉÅ', 'Pacman reward')}
      />
    );
  }

  if (gameState === 'tictactoe') {
    return (
      <TictactoeGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ìã±ÌÉùÌÜ† Î≥¥ÏÉÅ', 'Tic-Tac-Toe reward')}
      />
    );
  }

  if (gameState === 'trexrunner') {
    return (
      <TrexRunnerGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Ìã∞Î†âÏä§ Îü¨ÎÑà Î≥¥ÏÉÅ', 'T-Rex Runner reward')}
      />
    );
  }

  if (gameState === 'voxeldefense') {
    return (
      <VoxelMiningDefenseGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎßàÏù¥Îãù ÎîîÌéúÏä§ Î≥¥ÏÉÅ', 'Blitz Mining Defense reward')}
      />
    );
  }

  if (gameState === 'pixelstrike') {
    return (
      <VoxelPixelStrikeArenaGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌîΩÏÖÄ Ïä§Ìä∏ÎùºÏù¥ÌÅ¨ Î≥¥ÏÉÅ', 'Blitz Pixel Strike reward')}
      />
    );
  }

  if (gameState === 'voxelparkour') {
    return (
      <VoxelSkyParkourGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§Ïπ¥Ïù¥ ÌååÏø†Î•¥ Î≥¥ÏÉÅ', 'Blitz Sky Parkour reward')}
      />
    );
  }

  if (gameState === 'voxelbattlegrounds') {
    return (
      <VoxelBattlegroundsGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î∂àÎ¶ø Îã∑ÏßÄ Î≥¥ÏÉÅ', 'Blitz Bullet Dodge reward')}
      />
    );
  }

  if (gameState === 'voxeldungeon') {
    return (
      <VoxelDungeonCrawlerGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎçòÏ†Ñ Ïä¨ÎûòÏÖî Î≥¥ÏÉÅ', 'Blitz Dungeon Slasher reward')}
      />
    );
  }

  if (gameState === 'voxelspace') {
    return (
      <VoxelSpaceOdysseyGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§ÌéòÏù¥Ïä§ Ïò§ÎîîÏÑ∏Ïù¥ Î≥¥ÏÉÅ', 'Blitz Space Odyssey reward')}
      />
    );
  }

  if (gameState === 'voxelzombie') {
    return (
      <VoxelZombieSurvivalGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ï¢ÄÎπÑ ÏÑúÎ∞îÏù¥Î≤å Î≥¥ÏÉÅ', 'Blitz Zombie Survival reward')}
      />
    );
  }

  if (gameState === 'voxelsiege') {
    return (
      <VoxelMedievalSiegeGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏãúÏ¶à Î≥¥ÏÉÅ', 'Blitz Siege Sling reward')}
      />
    );
  }

  if (gameState === 'voxeltitan') {
    return (
      <VoxelTitanMechaGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌÉÄÏù¥ÌÉÑ Î©îÏπ¥ Î≥¥ÏÉÅ', 'Blitz Titan Mecha reward')}
      />
    );
  }

  if (gameState === 'voxeldeepsea') {
    return (
      <VoxelDeepSeaOdysseyGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Îî•Ïî® Îã§Ïù¥Î≤Ñ Î≥¥ÏÉÅ', 'Blitz Deep Sea Diver reward')}
      />
    );
  }

  if (gameState === 'voxelacefighter') {
    return (
      <VoxelAceFighterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'ÏÇ¨Ïù¥Î≤Ñ Î¶¨Îì¨ Î∏îÎûòÏä§ÌÑ∞ Î≥¥ÏÉÅ', 'Cyber Rhythm Blaster reward')}
      />
    );
  }

  if (gameState === 'voxeldriftmaster') {
    return (
      <VoxelDriftMasterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä¨ÎßÅ ÎìúÎ¶¨ÌîÑÌä∏ Î≥¥ÏÉÅ', 'Blitz Sling Drift reward')}
      />
    );
  }

  if (gameState === 'voxelmonsterisle') {
    return (
      <VoxelMonsterIsleGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î™¨Ïä§ÌÑ∞ ÌÖåÏù¥Î®∏ Î≥¥ÏÉÅ', 'Blitz Monster Tamer reward')}
      />
    );
  }

  if (gameState === 'voxelcyberninja') {
    return (
      <VoxelCyberNinjaGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏÑÄÎèÑÏö∞ ÎìÄÏñº Î≥¥ÏÉÅ', 'Blitz Shadow Duel reward')}
      />
    );
  }

  if (gameState === 'voxelraftsurvival') {
    return (
      <VoxelRaftSurvivalGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎóèÎ™© ÏÑúÎ∞îÏù¥Î≤å Î≥¥ÏÉÅ', 'Blitz Raft Survival reward')}
      />
    );
  }

  if (gameState === 'voxelsnowboard') {
    return (
      <VoxelSnowboardExtremeGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§ÎÖ∏Î≥¥Îìú ÏùµÏä§Ìä∏Î¶º Î≥¥ÏÉÅ', 'Blitz Snowboard Extreme reward')}
      />
    );
  }

  if (gameState === 'voxelpinball') {
    return (
      <VoxelPinballKnightsGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎÇòÏù¥Ï∏† Ïä¨ÎßÅ Î≥¥ÏÉÅ', 'Blitz Knights Sling reward')}
      />
    );
  }

  if (gameState === 'voxelpirate') {
    return (
      <VoxelPirateBattlesGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌååÏù¥Îüø Ï∫êÎÖº Î≥¥ÏÉÅ', 'Blitz Pirate Cannon reward')}
      />
    );
  }

  if (gameState === 'voxelovercooked') {
    return (
      <VoxelPixelOvercookedGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏÖ∞ÌîÑ ÌÉÄÏù¥Ïø§ Î≥¥ÏÉÅ', 'Blitz Chef Tycoon reward')}
      />
    );
  }

  if (gameState === 'voxelprophunt') {
    return (
      <VoxelPropHuntGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌîÑÎ°≠ ÌóåÌÑ∞ Î≥¥ÏÉÅ', 'Blitz Prop Hunter reward')}
      />
    );
  }

  if (gameState === 'voxelquantum') {
    return (
      <VoxelQuantumPortalGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌÄÄÌÖÄ Î£®ÌîÑ Î≥¥ÏÉÅ', 'Blitz Quantum Loop reward')}
      />
    );
  }

  if (gameState === 'voxelrollinghero') {
    return (
      <VoxelRollingHeroGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î°§ÎßÅ Î≥º Î≥¥ÏÉÅ', 'Blitz Rolling Ball reward')}
      />
    );
  }

  if (gameState === 'voxelsupersmash') {
    return (
      <VoxelSuperSmashGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏäàÌçº Ïä§Îß§Ïãú Î≥¥ÏÉÅ', 'Blitz Super Smash reward')}
      />
    );
  }

  if (gameState === 'voxeltowercraft') {
    return (
      <VoxelTowerCraftGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌÉÄÏõå ÌÅ¨ÎûòÌîÑÌä∏ Î≥¥ÏÉÅ', 'Blitz Tower Craft reward')}
      />
    );
  }

  if (gameState === 'voxelbeatblaster') {
    return (
      <VoxelBeatBlasterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'ÏïÑÏºÄÏù∏ Ï≤¥Ïù∏ ÎÑòÎ≤Ñ Î≥¥ÏÉÅ', 'Arcane Chain Number reward')}
      />
    );
  }

  if (gameState === 'voxelcastleblaster') {
    return (
      <VoxelCastleBlasterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§Ïπ¥Ïù¥ Ïä§ÌÉù Î≥¥ÏÉÅ', 'Blitz Sky Stack reward')}
      />
    );
  }

  if (gameState === 'voxelfactorycraft') {
    return (
      <VoxelFactoryCraftGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïπ© Î®∏ÏßÄ Î≥¥ÏÉÅ', 'Blitz Chip Merge reward')}
      />
    );
  }

  if (gameState === 'voxelsuperstrikers') {
    return (
      <VoxelSuperStrikersGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏäàÌçº Ïä§Ìä∏ÎùºÏù¥Ïª§ Î≥¥ÏÉÅ', 'Blitz Super Striker reward')}
      />
    );
  }

  if (gameState === 'voxelgladiatorcolosseum') {
    return (
      <VoxelGladiatorColosseumGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Í∏ÄÎûòÎîîÏóêÏù¥ÌÑ∞ Î≥¥ÏÉÅ', 'Blitz Gladiator Duel reward')}
      />
    );
  }

  if (gameState === 'voxeldragonslayer') {
    return (
      <VoxelDragonSlayerGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎìúÎûòÍ≥§ Î†àÏù¥Îìú Î≥¥ÏÉÅ', 'Blitz Dragon Raid reward')}
      />
    );
  }

  if (gameState === 'voxelarcherhero') {
    return (
      <VoxelArcherHeroGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'ÏïÑÏºÄÏù∏ Ïä¨ÎßÅÏÉ∑ Í∂ÅÏàò Î≥¥ÏÉÅ', 'Arcane Slingshot Archer reward')}
      />
    );
  }

  if (gameState === 'voxelvampiresurvival') {
    return (
      <VoxelVampireSurvivalGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î±ÄÌååÏù¥Ïñ¥ ÏÑúÎ∞îÏù¥Î≤å Î≥¥ÏÉÅ', 'Blitz Vampire Survival reward')}
      />
    );
  }

  if (gameState === 'voxeltankbounce') {
    return (
      <VoxelTankBounceGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌÉ±ÌÅ¨ Î∞îÏö¥Ïä§ Î≥¥ÏÉÅ', 'Blitz Tank Bounce reward')}
      />
    );
  }

  if (gameState === 'voxelninjaslash') {
    return (
      <VoxelNinjaSlashGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎãåÏûê Ïä¨ÎûòÏãú Î≥¥ÏÉÅ', 'Blitz Ninja Slash reward')}
      />
    );
  }

  if (gameState === 'voxelgolfmaster') {
    return (
      <VoxelGolfMasterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎØ∏ÎãàÍ≥®ÌîÑ Î≥¥ÏÉÅ', 'Blitz Mini Golf reward')}
      />
    );
  }

  if (gameState === 'voxellumberjacktycoon') {
    return (
      <VoxelLumberjackTycoonGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎüºÎ≤ÑÏû≠ Î≥¥ÏÉÅ', 'Blitz Lumberjack Chop reward')}
      />
    );
  }

  if (gameState === 'voxelfishingmaster') {
    return (
      <VoxelFishingMasterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌîºÏã± Ïä¨ÎßÅ Î≥¥ÏÉÅ', 'Blitz Fishing Sling reward')}
      />
    );
  }

  if (gameState === 'voxelfirerescue') {
    return (
      <VoxelFireRescueGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌååÏù¥Ïñ¥ Î†àÏä§ÌÅê Î≥¥ÏÉÅ', 'Blitz Fire Rescue reward')}
      />
    );
  }

  if (gameState === 'voxelwindhunter') {
    return (
      <VoxelWindHunterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏúàÎìú ÌóåÌÑ∞ Î≥¥ÏÉÅ', 'Blitz Wind Hunter reward')}
      />
    );
  }

  if (gameState === 'voxelsubwayrunner') {
    return (
      <VoxelSubwayRunnerGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏÑúÎ∏åÏõ®Ïù¥ Îü¨ÎÑà Î≥¥ÏÉÅ', 'Blitz Subway Runner reward')}
      />
    );
  }

  if (gameState === 'voxelcranemaster') {
    return (
      <VoxelCraneMasterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌÉùÎ∞∞ Î∂ÑÎ•ò Î≥¥ÏÉÅ', 'Blitz Express Sort reward')}
      />
    );
  }

  if (gameState === 'voxelmonstertruck') {
    return (
      <VoxelMonsterTruckGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î™¨Ïä§ÌÑ∞ Ìä∏Îü≠ Î≥¥ÏÉÅ', 'Blitz Monster Truck reward')}
      />
    );
  }

  if (gameState === 'voxeltowerstack') {
    return (
      <VoxelTowerStackGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌÉÄÏõå Ïä§ÌÉù Î≥¥ÏÉÅ', 'Blitz Tower Stack reward')}
      />
    );
  }

  if (gameState === 'voxelslamdunk') {
    return (
      <VoxelSlamDunkGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä¨Îû®Îç©ÌÅ¨ Î≥¥ÏÉÅ', 'Blitz Slam Dunk reward')}
      />
    );
  }

  if (gameState === 'voxelcoastertycoon') {
    return (
      <VoxelCoasterTycoonGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïπ¥Ìéò ÌÉÄÏù¥Ïø§ Î≥¥ÏÉÅ', 'Blitz Cafe Tycoon reward')}
      />
    );
  }

  if (gameState === 'voxelsniperhunter') {
    return (
      <VoxelSniperHunterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§ÎÇòÏù¥Ìçº ÌóåÌÑ∞ Î≥¥ÏÉÅ', 'Blitz Sniper Hunter reward')}
      />
    );
  }

  if (gameState === 'voxeljetskiwater') {
    return (
      <VoxelJetskiWaterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ï†úÌä∏Ïä§ÌÇ§ Î≥¥ÏÉÅ', 'Blitz Jetski Surf reward')}
      />
    );
  }

  if (gameState === 'voxelbaseballderby') {
    return (
      <VoxelBaseballDerbyGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä¨ÎùºÏù¥Ïä§ ÎãåÏûê Î≥¥ÏÉÅ', 'Blitz Slice Ninja reward')}
      />
    );
  }

  if (gameState === 'voxelboxingmighty') {
    return (
      <VoxelMightyBoxingGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î≥µÏã± Î≥¥ÏÉÅ', 'Blitz Boxing Champ reward')}
      />
    );
  }

  if (gameState === 'voxelmicrokart') {
    return (
      <VoxelMicroKartGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎßàÏù¥ÌÅ¨Î°ú Ïπ¥Ìä∏ Î≥¥ÏÉÅ', 'Blitz Micro Kart reward')}
      />
    );
  }

  if (gameState === 'voxeltreasuredigger') {
    return (
      <VoxelTreasureDiggerGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ìä∏Î†àÏ†Ä ÎîîÍ±∞ Î≥¥ÏÉÅ', 'Blitz Treasure Digger reward')}
      />
    );
  }

  if (gameState === 'voxelflightlanding') {
    return (
      <VoxelFlightLandingGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌîåÎùºÏù¥Ìä∏ ÎûúÎî© Î≥¥ÏÉÅ', 'Blitz Flight Landing reward')}
      />
    );
  }

  if (gameState === 'voxelgachaclaw') {
    return (
      <VoxelGachaClawGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Í∞ÄÏ±† Î≤ÑÏä§Ìä∏ Î≥¥ÏÉÅ', 'Blitz Gacha Burst reward')}
      />
    );
  }

  if (gameState === 'voxelbilliardstrick') {
    return (
      <VoxelBilliardsTrickGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ìä∏Î¶≠ Ìè¨ÏºìÎ≥º Î≥¥ÏÉÅ', 'Blitz Trick Pocket reward')}
      />
    );
  }

  if (gameState === 'voxeldartsbar') {
    return (
      <VoxelDartsBarGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌîåÎ¶≠ ÎÇòÏù¥ÌîÑ Î≥¥ÏÉÅ', 'Blitz Flick Knife reward')}
      />
    );
  }

  if (gameState === 'voxelwingsuitskydiving') {
    return (
      <VoxelWingsuitSkydivingGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏúôÏäàÌä∏ Î≥¥ÏÉÅ', 'Blitz Wingsuit reward')}
      />
    );
  }

  if (gameState === 'voxelbadmintonblitz') {
    return (
      <VoxelBadmintonBlitzGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌïëÌêÅ Îû†Î¶¨ Î≥¥ÏÉÅ', 'Blitz Ping Pong Rally reward')}
      />
    );
  }

  if (gameState === 'voxelmagnethole') {
    return (
      <VoxelMagnetHoleGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î∏îÎûôÌôÄ Î≥¥ÏÉÅ', 'Blitz Blackhole Sink reward')}
      />
    );
  }

  if (gameState === 'voxelmotocrossstunt') {
    return (
      <VoxelMotocrossStuntGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î™®ÌÜ†ÌÅ¨Î°úÏä§ Î≥¥ÏÉÅ', 'Blitz Motocross reward')}
      />
    );
  }

  if (gameState === 'voxelskateboardstreet') {
    return (
      <VoxelSkateboardStreetGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§ÏºÄÏù¥Ìä∏ Ïä§Ìä∏Î¶¨Ìä∏ Î≥¥ÏÉÅ', 'Blitz Skate Street reward')}
      />
    );
  }

  if (gameState === 'voxelsnowboardslalom') {
    return (
      <VoxelSnowboardSlalomGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏïåÌååÏù∏ Ïä¨ÎùºÎ°¨ Î≥¥ÏÉÅ', 'Blitz Alpine Slalom reward')}
      />
    );
  }

  if (gameState === 'voxelkaratebreak') {
    return (
      <VoxelKarateBreakGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Í∞ÄÎùºÌÖå Ï∞π Î≥¥ÏÉÅ', 'Blitz Karate Chop reward')}
      />
    );
  }

  if (gameState === 'voxelpinballclimber') {
    return (
      <VoxelPinballClimberGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌïÄÎ≥º ÌÅ¥ÎùºÏù¥Î®∏ Î≥¥ÏÉÅ', 'Blitz Pinball Climber reward')}
      />
    );
  }

  if (gameState === 'voxelcrazytaxi') {
    return (
      <VoxelCrazyTaxiGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌïòÏù¥Ïõ®Ïù¥ Î†àÏù¥ÏÑú Î≥¥ÏÉÅ', 'Blitz Highway Racer reward')}
      />
    );
  }

  if (gameState === 'voxellaserstealth') {
    return (
      <VoxelLaserStealthGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î†àÏù¥Ï†Ä Ïû†ÏûÖ Î≥¥ÏÉÅ', 'Blitz Laser Infiltration reward')}
      />
    );
  }

  if (gameState === 'voxeldojobalance') {
    return (
      <VoxelDojoBalanceGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§Î™® ÌÉúÌÅ¥ Î≥¥ÏÉÅ', 'Blitz Sumo Tackle reward')}
      />
    );
  }

  if (gameState === 'voxelbubblepop') {
    return (
      <VoxelBubblePopGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î≤ÑÎ∏î Î≤ÑÏä§Ìä∏ Î≥¥ÏÉÅ', 'Blitz Bubble Burst reward')}
      />
    );
  }

  if (gameState === 'voxelwaterslide') {
    return (
      <VoxelWaterSlideGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÏõåÌÑ∞ Ïä¨ÎùºÏù¥Îìú Î≥¥ÏÉÅ', 'Blitz Water Slide reward')}
      />
    );
  }

  if (gameState === 'voxelkrakenhunter') {
    return (
      <VoxelKrakenHunterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌÅ¨ÎùºÏºÑ Î≥¥ÏÉÅ', 'Blitz Kraken Slayer reward')}
      />
    );
  }

  if (gameState === 'voxelhalfpipeskater') {
    return (
      <VoxelHalfpipeSkaterGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌïòÌîÑÌååÏù¥ÌîÑ Î≥¥ÏÉÅ', 'Blitz Halfpipe Air reward')}
      />
    );
  }

  if (gameState === 'voxelnetherportal') {
    return (
      <VoxelNetherPortalGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÎÑ§Îçî Ìè¨ÌÉà Î≥¥ÏÉÅ', 'Blitz Nether Portal reward')}
      />
    );
  }

  if (gameState === 'voxelmegaflareassault') {
    return (
      <VoxelMegaFlareAssaultGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Î©îÍ∞Ä ÌîåÎ†àÏñ¥ Î≥¥ÏÉÅ', 'Blitz Mega Flare reward')}
      />
    );
  }

  if (gameState === 'voxelspikerolling') {
    return (
      <VoxelSpikeRollingGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§ÌååÏù¥ÌÅ¨ Î°§Îü¨ Î≥¥ÏÉÅ', 'Blitz Spike Roller reward')}
      />
    );
  }

  if (gameState === 'voxelterraquake') {
    return (
      <VoxelTerraQuakeGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌÖåÎùº ÌÄòÏù¥ÌÅ¨ Î≥¥ÏÉÅ', 'Blitz Terra Quake reward')}
      />
    );
  }

  if (gameState === 'voxeldreamweaver') {
    return (
      <VoxelDreamweaverGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† Ïä§ÌÉÄ Ìä∏Î†àÏù¥ÏÑú Î≥¥ÏÉÅ', 'Blitz Star Tracer reward')}
      />
    );
  }

  if (gameState === 'voxellifeflame') {
    return (
      <VoxelLifeFlameGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌîåÎ†àÏûÑ ÎîîÌéúÏä§ Î≥¥ÏÉÅ', 'Blitz Flame Defense reward')}
      />
    );
  }

  if (gameState === 'voxelarcanenexus') {
    return (
      <VoxelArcaneNexusGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'ÏïÑÏºÄÏù∏ Ï†¨ ÌÅ¨Îü¨Ïãú Î≥¥ÏÉÅ', 'Arcane Gem Crush reward')}
      />
    );
  }

  if (gameState === 'voxeldreadshadow') {
    return (
      <VoxelDreadShadowGame
        deck={playerDeck}
        language={language}
        lowSpecMode={lowSpecMode}
        playSfx={playSfx}
        onExit={() => setGameState('modeSelect')}
        onReward={(amount) => handleMinigameReward(amount, 'Î∏îÎ¶¨Ï∏† ÌîÑÎ¶¨Ï¶ò Î†àÏù¥Ï†Ä Î≥¥ÏÉÅ', 'Blitz Prism Laser reward')}
      />
    );
  }

  if (gameState === 'modeSelect') {
    // Ïò§ÎäòÏùò ÎØ∏ÏÖò Í≤åÏûÑ ID ÏÉùÏÑ± (ÎÇ†Ïßú Í∏∞Î∞ò Ìï¥ÏãúÎ°ú Îß§Ïùº ÍµêÏ≤¥)
    const getDailyMissionIds = (): string[] => {
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      const allIds = [
        'ai_battle', 'tournament', 'boss', 'dungeon', 'defense', 'snake', 'shooting',
        'gomoku', 'memorymatch', 'slide2048', 'cardjumper', 'cardtap', 'cardflip',
        'cardslide', 'cardsorcery', 'cardslot', 'cardheist', 'cardrush',
        'breakout', 'minesweeper', 'pacman', 'tictactoe', 'trexrunner',
        'voxeldefense', 'pixelstrike', 'voxelparkour', 'voxelbattlegrounds',
        'voxeldungeon', 'voxelspace', 'voxelzombie', 'voxelsiege', 'voxeltitan',
        'voxeldeepsea', 'voxelacefighter', 'voxeldriftmaster', 'voxelmonsterisle',
        'voxelcyberninja', 'voxelraftsurvival', 'voxelsnowboard', 'voxelpinball',
        'voxelpirate', 'voxelovercooked', 'voxelprophunt', 'voxelquantum',
        'voxelrollinghero', 'voxelsupersmash', 'voxeltowercraft', 'voxelbeatblaster',
        'voxelcastleblaster', 'voxelfactorycraft', 'voxelsuperstrikers',
        'voxelgladiatorcolosseum', 'voxeldragonslayer', 'voxelarcherhero',
        'voxelvampiresurvival', 'voxeltankbounce', 'voxelninjaslash',
        'voxelgolfmaster', 'voxellumberjacktycoon', 'voxelfishingmaster',
        'voxelfirerescue', 'voxelwindhunter', 'voxelsubwayrunner', 'voxelcranemaster',
        'voxelmonstertruck', 'voxeltowerstack', 'voxelslamdunk', 'voxelcoastertycoon',
        'voxelsniperhunter', 'voxeljetskiwater', 'voxelbaseballderby', 'voxelboxingmighty',
        'voxelmicrokart', 'voxeltreasuredigger', 'voxelflightlanding', 'voxelgachaclaw',
        'voxelbilliardstrick', 'voxeldartsbar', 'voxelwingsuitskydiving', 'voxelbadmintonblitz',
        'voxelmagnethole', 'voxelmotocrossstunt', 'voxelskateboardstreet', 'voxelsnowboardslalom',
        'voxelkaratebreak', 'voxelpinballclimber', 'voxelcrazytaxi', 'voxellaserstealth',
        'voxeldojobalance', 'voxelbubblepop', 'voxelwaterslide', 'voxelkrakenhunter',
        'voxelhalfpipeskater', 'voxelnetherportal', 'voxelmegaflareassault', 'voxelspikerolling',
        'voxelterraquake', 'voxeldreamweaver', 'voxellifeflame', 'voxelarcanenexus',
        'voxeldreadshadow'
      ];
      // Fisher-Yates shuffle with seeded random
      const shuffled = [...allIds];
      for (let i = shuffled.length - 1; i > 0; i--) {
        seed * (i + 1); // advance seed
        const j = ((seed * (i + 1) * 2654435761) >>> 0) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled.slice(0, 4); // Ïò§ÎäòÏùò ÎØ∏ÏÖò 4Í∞ú
    };
    const dailyMissionIds = getDailyMissionIds();

    const filteredModes = modes.filter((m, idx) => {
      if (showDailyMissions && !dailyMissionIds.includes(m.id)) return false;
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      const titleMatches = m.title.toLowerCase().includes(query);
      const guideMatches = m.guide ? m.guide.toLowerCase().includes(query) : false;
      const cardIndex = m.characterId || (idx + 1);
      const charCard = CARD_DATABASE[cardIndex] || CARD_DATABASE[((cardIndex - 1) % 110) + 1];
      const charKoMatches = charCard?.title ? charCard.title.toLowerCase().includes(query) : false;
      const charEnMatches = charCard?.title_en ? charCard.title_en.toLowerCase().includes(query) : false;
      const charElemMatches = charCard?.element ? charCard.element.toLowerCase().includes(query) : false;
      const numberMatches = query === String(cardIndex) || query === `no.${cardIndex}` || query === `no.${String(cardIndex).padStart(2, '0')}` || query === `#${cardIndex}`;
      return titleMatches || guideMatches || charKoMatches || charEnMatches || charElemMatches || numberMatches;
    });


    const kadanCard = CARD_DATABASE[41];
    const kadanName = kadanCard ? (language === 'ko' ? kadanCard.title : kadanCard.title_en) : 'Kadan';

    return (
      <div className="w-full px-4 py-4 sm:py-6 md:py-8 pb-20 flex flex-col gap-6 md:gap-10 min-h-screen bg-slate-50/50 font-sans text-slate-800 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 md:gap-10">
          {/* Title with ? help button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <PageHeader title={t('mode_select_title', language)} />
            </div>
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setHelpSlideIndex(0);
                setShowHelpPopup(true);
              }}
              className="min-w-[44px] min-h-[44px] rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-xs transition-all flex items-center justify-center cursor-pointer shrink-0"
              aria-label={language === 'ko' ? 'ÎèÑÏõÄÎßê' : 'Help'}
            >
              <HelpCircle size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setIsAutoBattle?.(false);
              setView?.('ranking');
            }}
            className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer"
            aria-label={t('mission_ranking_banner_cta', language)}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.24),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(67,56,202,0.92),rgba(14,165,233,0.70))]" />
            <div className="relative flex min-h-[132px] items-stretch gap-3 p-3 sm:min-h-[150px] sm:p-4">
              <div className="w-[112px] shrink-0 overflow-hidden rounded-lg border border-white/20 bg-white/10 sm:w-[140px] flex items-center justify-center p-1">
                <MissionCharacterPortrait cardId={41} name={kadanName} language={language} className="p-0" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-1 text-white">
                <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100">
                  <Swords size={12} />
                  {t('ranking_battle', language)}
                </div>
                <div>
                  <h2 className="text-lg font-black leading-tight sm:text-2xl">
                    {t('mission_ranking_banner_title', language)}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-100/85 sm:text-sm">
                    {t('mission_ranking_banner_desc', language)}
                  </p>
                </div>
                <div className="inline-flex min-h-[36px] w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-black text-slate-950 shadow-sm">
                  {t('mission_ranking_banner_cta', language)}
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </button>

          {/* Daily Missions Component */}
          <DailyMissionsComponent />

          {/* Hero Card Mission Matching Overview Banner */}
          <div className="w-full rounded-sm border border-slate-800 bg-slate-950 p-3 sm:p-4 text-white shadow-xs font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
         xúÏΩ{w«ë'˙ˇ|äÙ@cånÙõ ñèÇêÑI` »,tÄvwıTUÄ`‹Cçi≠H_—k…¢dJ¢wdKˆïœ“2mSªö{œπ˜õ¯Ov„å>¬ç»Ã™   ¨™nê2eoK–ı»gddDdƒ/ÅœÈ¶uç4ZÜÎ^6⁄Êô±ÌñπO,œlª˘ÜŸÒLáÏ›|eÏÏﬂÈ#øπó/….˛pÏ^ßi6ÛnõlÌ‰çˆñÈ‰k≈‚T©F∂lß	e≤_¸VnUä$^Û?˜\œ⁄>øzÊææB‹]«Í\Õ√ãv«Àoµå∆Uˆ»æ´h-!_¸>àwb
z°Óõ™ål£UV÷oª]£#æNõª^*v˜7ƒ^Ù∫]”iÆI<æ[ùù¸û’åè@0∏8Ç0Ó∫¡-Iw?_*‘H˜ _Ñ_˛iF
?//¨,ëKã´´ãKó…Í˜V◊.©˚4ÖùÆø%Ï/˝€mûâm‘∂cùîfKº5skÛ//^~âlŸÕ$√ç›J¨y˚.q€≥¨uÌmÌÌ¬lì∂á√®iÛaÀËÏÙåìú9sÜå_µ«â¶oÁ»ï¡É…sámªi∫ÖñŸŸÒvèˇ˝áÉÔê˛ˇx8¯·ÚËã[ÉènêˇÔ=rŸ.Kˇ«sá´–˝NN|g¢–5ö´û·xπÚ$/éOë„èﬁ¸ÏAˇw…‡À˝ü¬Ø{7˙7ê˛ßüæ¸Ì]õf…ï5€3Zr´»%Àu-ªC^Ç°rGhœÀ¶cìy√ií’VÃï#ÂLÌV´Q5ÍãŸ÷'ÆFz3EyŸ∞Î”E∫f*∏bJ¬äí¯ék∂∂Û.ˆ)Ü~3zû≠bï√,˝ú#„˛$æwøˇˆ˚˝_ﬁáôß√yZc6«ètÙØÆ»\¶m≥m:F´IYΩ◊∂;–õR±¯<…E©a*˙uB]∑bäTó∫ŸFW]¶¢eMdâéŸ2ˆÕ¶?o^lß¶a=7éèpl–`iˆÛYˇß˜¢Îp·uRÍÒ&_S9∫`©Ãœ≠\ÿº0∑6w~nuaΩ¥qÆ‡Y^À$ﬂˇ>Ã‹ª7ˇœ=¯Ÿˇ’ÁÉ∑>?öËˇÒ˙Òç˚dÊ›¡çª˝[◊që>˙˝Ω¡›{‚™˝ü∑˚ø˙-}é÷ıË˛uÎ∑ÛKxÒŒÒùáÉèn„s˝˚˜?˙qˇˆxè‡ı∑˛–ø˘fˇÊ'Ö+±^¡‚^∏f:§ÕÛå9±\√oÌt`0“ÎXˇ“3ÖÂJ)úl;võ≠zí”vy”Ï–^œ˝Kœp,zÖmßiùÇ¥ÍOOu≈…·‘!\9ú˙{r	Hç¨öÜ”ÿ%/@õ<s«Ü>ºhµpAØ[.˘˚)±\%¿˘Ü›b Ëh/ø›kµêBJÖ§s_2Ÿ2Ω=”Ïhv˝l‹Ÿã≥≤›≤˜Ú˚îÖêÓVæD:vﬁm8v´µe8$≤hqa≤…Mßc∂Æ‡¨áƒj«0Z≠ÒI“2∂Ã÷+6êl
É/‡|FÙ˛–BöÉaä?Aé&ııTöëj*Hˇ˜¸zXŒ6ùæ\õú9K⁄ÖÜ?´tE¬€Í¶@Aﬂµ˜Õ÷(Â$6xÀÄz#çÜïu|3cã˘ÎöVüßwG-)±›∞*åf¥›»pæ∫>¯ênôÍ‰ÖhZ?GÔéZRbÎªΩ◊_óF˝¯«_~u;[m¸uMªóÈ›QKJl7Á=CZIˇÛˆ‡ﬂæ¸Ï´lÚ4MüßwG-âƒE´çB€ËÊ‡E,·P—±Ü›q=b4<Îlã(€òœlŒãU¡Î´˘üo;¶◊s:$ßÃ∑zûgw4ÁUÛ‡Ã!+Y%‚«ÓÃ∑¨∆’3áπ	]ÛŸß€2V∑˜s„ªû◊ugß¶Äıöû[h[˚W-Ø–∞ßX7]œv`ˇür∑˜ß µ˙4˝ëÔ:Ê5À‹+¥ªïÒ	U7Ÿä\ïÜ'«:Ä[ù—9–æ{§Îa∏I6:ÍQƒœòF$•Z	H`3ﬂ±˜£Àe;ª’D≤„ZÏˆy`˛§—s\€…wmãn@\ˆıwó∂’…ÔÊ◊+u™ë¶(‰c™¬>lòµ∑Qæã»‡Çr„f®¢o4qkt«
ú•≤πÒT ﬂÛe∏∞ã€ÌlP?∏∫í'‘¶SVï¢;íg– ‡€BG]ˆÈ)∂\Tu(Î(÷DΩ‘πÜí’?Ù`Y=S—**C≈•î∑)w`ÇS\⁄·"ökΩd\™â/Éêf∑z07-s€ˆl|¶ $O…ìN√Ω iCd*Vç’Èˆºÿ8x]Æ=ƒÁÚö—ÍAìX?ˇ°p|ËÅ«Ï¬‰¡c9ìr∫ Érfƒ‡”+–¬tºßaÓ¬ä3ù3jé´ÚTØ π˝ŒÌ˛[Ôà?lÿø∫ä∆ı¡˛k°P†S*ß”≠ÄÿŸEŸºÉz8>oJƒ(«Ñ‹V~öt¸q¿‘_q≠≈Wà¿[|÷ LUé√Ó
*⁄∂›Ëπ≥vœkY‰Eì_ä‘U0•Ê«&\ú7Ú¬äMFø¡H;á4ß„„ ı≠"[«⁄ŸeÍgF ÂLF∏X«QÅ=V£“2ıè˛:*≈áDœ%&d˝J‚	÷EÄóÿ≈ÚLÒ„RÎ⁄Æ	ƒ˜¢É$∏Í†DU6Ê4]“⁄qÏΩ	YˇjVGV|@°Å›´à™Mï¥õ≥{ï/n¯‘3èaÜï»ˆ√âô§±¸C–ùÚ◊,◊⁄jô)Í‹ˆ`}.≈lBn{6Rr5–‡"‹ÖﬂUﬁ ◊â÷•`&ë©ñâlfÛ‡P˙ µ'Az‹◊»0L [Ñ_Ûvª"Xª`¡ó8«g‚,¬›ßO6vˆ\”Yl¢ˆùÉj»wHI±_∑·y:«gHTèä›¿r¢˜rπ∞“<Nû'•Rq+⁄H™G*
Í<Gr }íﬂÁ¶ìYÈ¬¶ŸôÄãmˆ-iX.˜⁄/⁄N®◊ƒr˚d–ˆ∏q2^XÏ¬‘Yh¡:Ëxàes®o€⁄—4ƒCê’IŒÔ¬πÇ…ﬂF€H«ÏÛ ëÂEó6O◊|Ìº—‹1Ÿ ;£2€≤ p ˜Äœ8tØﬂ80:˘ô5ÉQ6D/TBÅà~i™^ÑΩ&±‡mÀ1˝r€5#Â“BπÙ{∂röC"t¡Í4˝ö‹´ëäªP~ÕV|oW™H0®àïàU±+BeÏB∂Íö†[ÿ©>ÿ+¸˙Ã2,±B~I®ë_©g™∑k£)UŸF
	¢€s∫≠Ë‘ÒKB≠¸JRG«„í;˚ZëÖm(e\•%;2¿Ïd˛ı«ˇÌ”Ã¥˚ı«Ô¸Ú˘ı«∑~Ûﬂ>≠˝˘Á˜3ëL?æ˚´Så€u*_˛˘Éw∞AˇÈÔbÂ%®Ùß€6ÍìÿWï*UÈ€ZÖﬁÍÄ:j¥ŒtVÀ;ò%≈I?K5ùält,`Ëf‰ù}ß®{%T|Ò≠&h/Ù%√€-ÄñKw»ø'≈B±2	?+∫R@Nnô/£åRΩΩ∑⁄5TZ:Gè` ±	y(#¨/6{é¡˛.∞SÍ“5ß¶∫aÖ9±[ ø0…Oß≤z∆›ÊŒø%ˆ«l ”¿Q]Ü˙rH8	O∑Xß›…oe±;ØòÏΩN†‰Èªnm–˘ÄíŸ‚YË–•É*ºH`◊ó ≤Ä# ª˛s€Ëµ<}ìÒÛÕˆ∞√ùe¿â¬‡»Øßº|ïõûJ”‘ƒm~°\¶`œY∂T-ïKÊÜˆƒVP[πçGvÖòˆ3nTj«dQm$P.v≠fz†äÆlD£[ 6tk“p,#O≠>gØ<w»eÿ#ê¢/€ÖÁe°ıà¿5.8)œ…LP†Œ≠Õøƒ4∏óaÄˆù7úòu'¸»ÍwAÖgüjºho‰˙ﬁw$fÇ+~˛:ì‰‘#ùïÿÆœ©˝bBÀ†÷G$ÛIõØ„a7<ß◊ACzB©ä≥s˘Ã|gúu∆aÆ8e¡'tˆÒ–ÿ˙∞—òéåéTbÀ	íVú≤í˙ö‡…£]Àd[5◊l[‹"ùa‰ÅíÉ%pÇFk]¯ÌLtSdÀÅìüñ°Ë≠˙˙—“–ß Å‰¥Õõî4≈â£‰¡•<{ËK‹ZÁë§Nç	~j¥3ß"]£Âly˘:P\öµ:hcïg®8˝â√PÕÓ⁄{0*J+abWí)9‘√sïà⁄XUØwdÇ’¢f~S»üêÂB–1÷Ø§Öêeú4ßÏÂÑu¢:>?∏„Ã˚ˆ'∂Ô,€03À#ÁÌ˝!vn&LuÌTæBÇc	y´ﬁÕW®Qo7_•G¯=HeI (’})c«1ö‘ì˜lÿ”–ÁEPvØ¡>bH•T,WÅ6l¯R4ä”•j3∆:ÀwáŒ=YÌm°}k±sïY[ı„°¿mu@6Ã”]gl¥ÇÜÁñ”hôõÜ∑Y+>øY->?ÈÏlπôôIhˆdπZö•dzbí
>]√Åw6Oüü Fƒö<Z]jøWú¿Ñ}óEc_“⁄Ê^Ö˝îCÕuÕ3·
 míûyú	˜‚õ√ó#ÖdπÀŒ´í:Çñ≈ƒvvYfïØ‘èb‹É ((`6ªõÁÚeká¥Ú’‰ ètKã”é˙^õ,}É¿N.¢â`ÅJ«xŒÒF£¢-Z2,9z*W‚ßI+–ó⁄îB^…‰¨‰ΩQjê0››¶¶A∂Ñﬂt¯∂Z=Gÿ9WeC\%®ZDÇJ‰‚Ï»K<gri˚˘=ÿæäœo¯áÕn;Ö=?´ê⁄3J,â	Lyª∞Ö˚¯¥9√NÕP&ƒ0ÿ•DI"q ˚∏÷%=ØlÇë‹¡¥--e¨û‹éÜnŒdçûDº¯>/v∂Ìaµ©pØ*K ìﬁsïƒ=E›ÂDäêRˇR	b˚t†ˆ∆<âπÍÊìêOX‹;√_v"üLá•˘dL¢+˚Ñ÷±4˚ò◊≥ªÀ–c«H3î∞œ7eÍ¡¸Rñ*|rÌî«µˆˆâÏ≠5ÿX)eÔÂÎLŒ™G¥óÅû%èõSØ˚SÒÛ·›'ü∏π&IXTŸjîÜÅàVñ8¢UGÌ≥„ì˛o~H˙øË·}ÊŒ±kÔë¶€p¨.vA·º~íƒπƒÖ†˜!Úü8°^,≥ëNz†≠6¶ñ˘ºB2(åh˘Û›_Aûcwvb‚[Ë¸H†£;:˙ﬁ…4Uµﬁº†‚I™˝'¡ê<ﬂYΩºJNœÔö◊†G+ÃÿƒúMä±ñiÍ‚ÿ◊†Ö‘öÁÎ2ÅŸß¢Ñ∞8Èü€ % æ'¥‡$‹‘}MÖ«WÒ˚1w∞CÒ`·√„wæ¢~\7>|¯‡¯Ê˝˛√[‰—Éü<˙˝=?‚Íœ◊ﬂ!ÀÂ|Y!.úæLï÷π¶RáπÜ¨•„ùC36~
ßt∏âyıºl∂∫†äw{]Ÿ?géù¶-;¶kvf¥¯CòæÀ^UH†IÁ √=’æ¢<—S=hÓ[^zq"≥≤0,»◊ê_œØóã3Èﬁ¨§jöT¨:0TAS)*:”oP‚ãË7†d( R¯¨âí€6ZÆ QÂ%ñxP+Lï€0Z&VŒ–3’≤ÊPUò3˛F‚¨?sK}MπQŸoi}'Ft„bdûg⁄(ﬁ\˝DH	•"ﬂË]‡N]ÒÜﬁ€Ë‚óW®ª aIl∞*(çW¶àH›Bµã6æ9”]#ﬁòZ~∏d≥⁄Òè˚äÅtR‘≤Zçcñ‰∏:∏qÔ¯RqÜ*I<<‚Q¢ô–?K≠)›øî«“f–†%ƒM¨]S‹Ô~-g≈‹cÖË<≥U¡©ÙN¢Z1ÍÇfÅ–VπÁ{ÁG\ı˝ıB	^tló%Ôr1C†Ω,2áõ:h£∂£Ò√◊Ó—Å+´¬hàZ)!Iñ’ÔÒÒòRﬂï9t∆ïIaŸjc∫áXG*∫M ÚÒ˛ÕO?˚…Òª4îŒÅﬁøé±ß˝õoÚÂ7¯‰'É˜nn Èˇ¸ˆÒªw–{ú=⁄ˇÂW|U¬Â¡çáÉﬁ)êG˜ﬂo√É,º+·•øs´ÔMê\∞îŸ:|›ª˚Ë˜8~˜◊<éTﬂzAﬁµmdOäbã›’è93u£”DZµv®ø:Y0ªÙ±∑∑M«ı„MÒ6™≈Ùylè√cAª§áb'√N
é„08∏«?¯-¯Øê„winÑ#≤(‹w®ˇß7˝0∫ ˆ˛É˚Éáø¿∞˛s§ˇ≈ç„∑æ¬ÅÓøy£ˇÀX,é¸çáÑ)åÙ÷Ôø¬0ﬂh@o‚D¨]å=¢Üsÿu«Ãÿ5º0z†@^Eﬁ.∫/±UÃâò8%Ù5◊I”Ù´≈(Pø(SOúÖ!©ù—¯‡≠/1:F„ÔﬂËˇ€-2∏yó“¿‡ﬂﬂA˚é«G_¸˚Ò{w_ﬁ°≥Ú¡è˚?íø7‰HΩfu:œÃ»îQh√nw[&sà∆È∏‰¿Ó—∆4ÄÚáq¨˛qπ†ﬁ(§òÊ‡Ú∞bÑNBPïìf<\/N¢¨VfqÄ9ãÓDzÀrÇ~®Éüïdª»–Üüq€»næ›ƒbõŒ∏>⁄?•>â#0øW´”¥vld˘tó˜B=ù$⁄ñµ
ÌÑVt–Î©∫˘‘âàÒ›Ë,‡âÈfœ∏åÚr§é⁄Ò˝çﬁˇŸfﬂóY™EAfa_ûôÖ}Cﬁÿ2⁄Va”?ühÃ‡FïãhOìzÍ	R-,≈äßùô>Nìr‚9Ï„&èÔ<	ÚWqH¸Z-@˙ç— ee¥°ˇ…B'„[]ÈºíFâGÿ£LÒ0Z
~¢>Ñ’ ‘0˚Ã«-ÒòñKÔ£œZ‚i´⁄rOÂ∫]\∞;fÇô~ƒEö`ùTí%-ı˜"ïüûRò˝Ç˚h0|µÉÜñy;¸∏˘l£1"&ô©Q,ÖΩ€°Ù÷©åFƒå&ƒ,ƒ$Û!lI≈QÏáJ8ò$√•ﬁt8≠0∆ãR/·ÿLhñr<“:õô7ìuo(À·Pv√®ÔÉ‡ô\ı}+|Gsjl7âhdîù«∏=qΩ∏Y‹¨¡~¥I]® ’⁄d©6=Y¢.TµâOtﬂË=…g‘TJ∞A¶„,¢πSÚSsòüZÄ¥àûia¯XÃ$’Ä)ªtá¡oeµ≠ÒÑ∏à´ªñŸjŒµL«ﬂÀUù‘Ñ=‡‘îÔˆÄêıñ£›r¨å÷N
–"ÛΩˆMC‘ÓÏ°ó£!UŒfCXKõ‘Åb¿∞d‚ËÙ‘ny8;◊¬ïÌœ¶ÛM8§∞ıkGGÍ~ÈVl9&˘„’Jå~}ˇ˝·¸ "ÚdTñPIíJ∑eŒ‘jä‘ã
>}dX˚u¬p^0ùEı2,ñ,´r/_™#Bk=&\ßz2◊˘ˇ⁄ÊËe"Û,’îÃ≥º”_≈[–òÜ.‡Ù/l€>còé|‡¶¯!?£¬ÚXÉ⁄XN†æ∏+¬ÚƒNÆ¯¿Da,Ÿ—:Tb7ÆÍlŒSt’)]†tgjC∏èı≠êÕ‚	ßUD√õ¶€à0∆¨f≤!BM„>7√Ê'd uNπxQ;˛+Â∆iÃXÄªàx*∆-2”5=j™ŒôFÔB*¨ò0*èç“,Û31v?*◊l£eªf:≈¶ÒoÈ¢N-”›jU(kŸtØﬂ◊ÔoAﬂ
§Siæiÿú≤Ó5¶–¶B? ,î	ÖπÊ€®2≈0”¶G‘ï¶aß«Å∫Tú§ˇ*Å¢Ñ!ëaTû®™§9z7è-πEÂ¨∂ƒ@WíBÜ‘∞x¡≤,PcUÏ	uºﬁË‡¸™∑„ ˝˚≠¿)•ÔT¿?Ìÿ=ƒ,ÚEµ≤&H&·¨_L2≤2˙[ÿ<ÊC˛Dı4£H€yª&∆€m05¬åe2|¶©/
):ijÜ‹˙îäãZ‚N>=•êOKêûÚ,∏TΩ˘át@ˇZ,MÌdU#îñE°¥&	§fßyRitö€]MÙ≤¨ßåïËOñÒô$}£˝Çô“¸˛ªÉR;¸“+J+¸∑B(£XaNõ
ÈÀ]Í¬æÒ≠œf‡Û∏Ã·£Y√SÖ=¸ƒW»º0¡ÅeÓê
ßeí∞ôô%Tç"GÒ√¸À{”5*ñUûÄ¿óXt	±RaEπ]Dû≠Ámªc∫.º^+Ní¶—Ó¬ß£≈¯˙(˜ÍdΩ29SÕlpÁ
DíüoúW0wy
ñ¢
Ì—
~g«î9e„:™Œ`CÜÒ‚ﬁ»w3D#8§.ŸîNïôæ8¨°µƒ≈≈ª–ÔYg?àÎ}i/¬mì>≠µâE]72√cm`Âem¢˝k√≤≈òë·Ãiÿ¡9Ê⁄ó≠èTXÿÇÅ{íÜ$áíYNŒëŸG5ãò≠è¡Ñ`~HS÷Nî»¸7¸N*˛ÙŸ‡G∑xæê,ZC Aè≈¨°9ÑB†_ıëÆ#MÓ®ÜKiŒYñMöE•oJ‚Ãí‰ÅˇVç8OíÛ1
√|lüFâ8ËÉc¢ùu∂ªM˜F	¡€ë÷_(PHƒ‡CO‹UC@Yû«ºdxç›qîü˝í•n◊Ó¿Ê£ÒI–ï…ÈÄò”ô€p∏1'ñÏM¿ó¶ß[Å§¸0r~zóIBUÙ∞m¯Ûˆ¿@˘ÓÎ®1Í£»–:«õa…*Ûè¥-kç†$äræO/DO	ï•Bëë(K±€G|æ¸c7˝©<ë¿ß|¯ÅH6€H%õ¿Üz›î#˙ÏéŸërÌxﬁ(Âûè.ÁäWæZåûÑ∏^Rß†Céµø	ºƒ⁄b,HÍWW^ΩjË˜+#WQáM¿cROy¨ÌÈ¢N«®[:} °qˆ„ÛP4©\ ´]Ó•¡∂ó{€jôèΩËº@j˘’ñÌ1 ú%∫è3Vr©,ƒüˆ„≈¯•D∆ÓL
5tÊêÆB≥πL/]0W◊ãΩ\xÕÚvWaÊ\~m.Qfls¶ƒJ‰ÁzBY9ô{öpS≈÷ËxkB]k3xõ€€&›t^uMÁ0nÔR v¨R ˜Ø»‡ŒÉüˇê”}èf€îc¸Ó∞zbMÏƒPoX≥ÊÆ@Ø:≠X€∫ª∂gø∫rQ]ç^¨.√øá}ä›ÖÌh«‰7Øá∞]£anôÜShÿÌ©SÖ˝)D?B˛ƒ–ÿß‹k;Á\”lûy.^•’<za+ÄöGQ‡ÃV›¨lWØ®zç”¨†"©´ùì>¬ûﬁ5:Õñ)\ä>≠èﬁ±â#@≈ÒÊ≠nÔ=≤?ƒªâ;Éºr}'Yı9Ñ˝ÏjÎ‡5sÀ≥mÖë+^≤>‘7î√Pëçù≥0Ö[x®T£¯l°£< ˇî9	6ÜJ`cà £ß'T(	õ„}*XΩ÷ÆQ∞≥Ï
5xΩX®‘Ã6á⁄‡#Rah∑Ì-‹¶pŸcs≤π€€R∫Æ)£ñÜë	Q»# ÆQÚ` ˘+ˆQBdmdH0®î	—lZΩvLqéjpöú™—∂∏Ωv€phí&ÂùÖénêÙVâjHüËÀ1¢Dø@‡´ÑôhyÁfËx¨4ƒêX2Z ú]ªÕ‹U6ªéΩíæõëtÙA È™£’,ÛZÊaîº£©CØ‚ùÖÆÂbTÈPuF˙/Y]jÒZóahÄ…=?‹lg<#Æg‰ ¢Ú]2ŒÇ≈ÆeèyL*ï¢§©êÄ‰ísïÛDææ\EëzÌqzˆÏŸN´πiwÕŒ¶? #˚Ù;Úã.•P–UwL™È¢q#Á9 da√ÃÅjOD ÈJëDå»4ƒz_ùh¢¢ªcú,∆Q‚;—„0i®"a‚ÈÔP "ÀL2'kˆŒh≤5ÙêE	ØtMÚM£ax;ˆx…∆óë*,Áï∆è2sÚ2µié˚.á˙EÓ7zAcW—SÒTÖ˛H˜TL√x·"e¨QÊËàr!Ëº>Ä‚ú∫Vå& Á$WÚÏe[>ÒJ[O¿Àg·¿LÍÿjıtô˘˚	§Ø{m¢æπ…ÁW⁄ÈuX]ZËP"Fêª¸‡«Wªë»Gêª∞/K€€ëÀä√	-7à?öàt•i°6î:-ÔM‰Ãw◊D)çf∂IFÆb·◊sm#„ì)XÏ„Y´@-“yÏê/*VöÕôŒÀ$Hséï'ÂÌ(… ±¬¥zâŒÿFÜ\–‹óp¢◊K”œo¯8¿<â/´.®“∞C÷¶N•·i#l5,]=46ˇ4®Yj¢dÑèÂ^¥WMx≈âÙÁµÿi/f3"ƒ>)¯~âHì∫#Ω‡EÕ]‹øÈ@Wj’Y‹ƒÈ± °*]»s@`˘ÖÈY2 ^§ ë§X
Ì' ®ê"Às≤∂cCõ.9CvÃéÈ Sòo‰Ñ÷NFÛ3¶@ª≤:\”piÇµñ›`:0ˆ¬àØ0ñ 
òéΩ	{≈ÑgœéS≥„8˚RR¶s?,¡*<(áª	:ô–Îì‰?Ø.].∞§á¿r—NÎŒ ” ﬂ‹È¡¶¸∏j¡îoˆµû"Q-‡9FÆ2"˚k‹Ì∏aÕΩn¶®9ûVË7á˘ΩﬁŸ1ùóçÆg5r„ÃDíÒ%zPóå◊⁄"”¸œ9reÉ7˙∑Æì˛è7xÔ6ytˇ˙‡£_í¡›{˝_}é∞TÈw§W&â·˝‰û}Ó0:uÖ…*˝,®∂P
|tªˇˆ˚Éª_Q¸%x˚˛Ø˚∑Ôﬁ—Äûπí⁄æYre≈lÿÌ6ûY6˝ïH®E>≠d◊p…
™&≤öÆŸ|ÊJ2VçbÈAˇó<8æqâ˜ã˜à˙
ºmÅ◊ï<ˆâìûˆ¨∞˝¢Òç°®9*àÅ„¶◊@‹ØñkDK»≤¢HôUÜqTb¢Ñ$∂GN€◊ãÖôÈ3"H◊5"r∏›‘,Ûâ€‹?]uÍs)v0[Ï2/î…ÊJj˘Ûø É?æ3¯"X;iÙÉo∞›P§§Ò‘<#C\$·Ï*_Kp'Pjˆ‚w.ΩÁô”~,±ΩrÛN›∞ŸäBÎ™ÈQ§∞ƒ]‹d∆<Ü∆T<8,u°clµh∆‚H0ÂxÊSé¬Ã#›⁄∫Ü„ö9·¡	˙$>Ø˝(Ñ&òπ
•#ñ‚˚\ÅŸ©‚o“≥ç{Àˆ®x;≥å£%'x≤h©ÆÒû§ jù9O˙Æ4Å⁄>Qq·mç∑èhAÀƒN™<µüƒTƒ£r \õô,UäìÂj£õ–-ï'dºßT(ñ7≤£6Ê@è≤HøÉhﬁ”8∞∆≈ÍûçŸÿ#)ŒCån«ˆ®u"¬0ì–π’ Â)g>Q£";8`⁄∞gÚeê¡î pQïk)«¥®J(‰làKe5˛x
«Uq∑õIuf—ù©eomå·∑s«ÿì”Ëπg‘&•u`bˆÊàS¨œJìbdÌÙÈ
^¯ñc˘–·ø'^˛”çö9ú ¯—·ë£~ƒ†–übªh	∫∂´	9®≈¸z3¡i6>æâÕ‘jÇ”B≠6d$™‰E9πy∞=7OìÕ%†ˆ+˘&˘Ü¯Á	¡û∞Ò ó›tp≠<xûãQTç
ê âŸ †N≥ ŸËf„Öçs¥ ŒL,Ô&˛)◊¥ Æ(ÕÏ4¢B√Àˆ£_î∆.ß;I´Éâß„»ÒhR.ö”4—Wx®¢U“$Áe∞
èÑ‰Æ{õ††-H¶LùLv‰ÿ‡º11Ä'IeíTpß◊NGfVsxT¶ÚHé¬2UÙ‡7aRËÈî@Rß‚ä∫4â¬PæNWpÌo>GõÃNòØ±õ¢Éûí]NŸ~R.z%GÒƒ[Ñ8#4(Òˆ–»√zÛ:⁄≤Z¿í@÷[eyû÷ï*ò]ÁB5hˇ61T2∂âú|©Ó`‚W¸Å“ÜB}
‡sn}‹ÓyˇµÈ“ ºÒÄ|Ç4EÊñmªû‚Óûi\5;äéi≥s¶oS≥ƒe8…GÃÜÅ·z‘M‚0-8àÁﬂ0sAM0å„IfhI˝—é#ÂFX≈QåíËA9ô3E(1Â¨/÷à¯€ÉMr˛EvˇÃQô:G¡0ciö’9ú!‘=}B:GX
÷œ√1;T)™cEVﬁaÀÚiî”Ì9]PÎÎ5,á^ÒÛ§’‘Au·'-˚9	0ú´®ÀÍm∂…X%AIiª»à˚H-ÿG‹No'=©*Ï1>”zÓ–◊#’6s≤Ó§ùÁÍ÷w<èZJy…~ñŸî≠¨qIûóYA_“ÙsˆI¬[ãô<˜ªöﬁºôé∞ñtR2SKc&~6Œoíöˆèy=Öå'∞µah*ï∂±oa\¸—%◊,◊bÎ¨@e¢∞0À}©ÎR∏J
æ∂”uÁmjòçbÔcr·ÂUö6kñ\4ÿ <r	Jrƒˇ˝îhçT€”Eƒ«C6Ñ»ÒP;÷5Dc¿¶«;†µ9ÊˆôCËmÿäπ≠O≠N”õQF´Ωç¨Ì5€π
r y±eÙ\„Ç·ÓnŸºE#∏î≠Pô”0üZπ 3ïWYl§pH’“ sb/ø^ÆSèﬂ˛∞$ﬁìÍå˘FììÀÇD„¿Ë¯ñ{<O◊hhç™v˜7ÀUﬂUü,Mó'À•≤o!¨ÒÁ5I±>;ù>ÿtK#Ç%¥”a–ãÏ2û´‰≥ò—F§<°à˘˘ÎΩ7ŸÒ≈ÿŸ◊ñV^Yzuç¨ÆÕ≠≠é‡›ìR§≤°&?yzntZ£Ïü¶Æ‘âóTä2;’ >üÅÌ3Ÿå£¸)M|@»(ÅK˚Q$ÏÏÀıŸ È Z]k9û)"Ö˛0DçÒ"ø÷Çgøà«π(w Zˆ]“n—–fZW«v⁄FKÏ·)®≠ùÿ˙Ñ{åM≤ÿ‹m:P.Åçäü—ÁJ≈ˆÑ÷Mß∑˚É(°Gå\Üæ$oRz›Ov…]}¥[eGª˛…rIÄ≠PI]Ô†Eœ!Äñº›YrÂπ√KÜ∑[h[´‚$…IL¶H©C?ãGœ_—;æK®ΩÒ-XtÛFÀv,”},ãéceYv~Ω¡≤+ühŸ]!v‘ïß÷À¶É§ÂÅ…WLÍ°ôFÍ#Pﬁ©¬©â†´ïâ£≤mÄ>“s:ﬁ7™	Ùaì∏\ÈﬂJwzg∫ËÉú#V`Ê<)SÅ`$B§Í◊ø˝5 pEÃ¯Ëw?{@˙7?ÈﬂºM˙ÔﬁÍä.ˇ•√·◊£/o>x@Ê1€`‘[ﬁç„7?ßNÑ7Ô>˙Iˇ6œ€¯µ8ºf¥Æœh#SFô2œ}$ˇKá'∏‹≥º]öM±cäsãœå©ºö≤≈(©¶“ó◊q¥fâ}§›Ï3Fπˇ≠'`zºéPÇF\ãKªÌ¶(öÈù
5Ωåù»¶Íò
xË#‰h˝tÏ=FBe´%–—◊ˇÙ«|zΩˇˆt7Ì˘Ÿ£˚7œ‡}Õ¯…àÑ¶X•D¢Ã7IÈemnô¨,\ óÊV^YXY%kKd·ÚKs/- ]êï•ÛKkq§At»)Ω–≥FPõÇÒÕìÛT"Û[¶”ÌuÆíÀÏ;ä◊´∏M*…H®ûGùPP¡ã‹
òÄVLØDK–KÅ¢÷ü-%£lnƒŒÁπ'T√±] K
ïÚ˜xi.CÜEDyÄΩ£π;é[+>èˇ&…≥e£lTMBˇfÕAI‡˘âòóÓñΩøJ…tñåS∑RÑˇ‡ŸÓ>·Ä÷§\´Ò≈Bπ6uøçq≈õM"ï‡ÑëóPb_ÇqQÑ¶·ì(2ïò˛Kw"H 8©6û¯–"Ø6úphü-noìRwíâm]É¬ƒ$ëüù)6ÕnÌ+jÈ∞´†¬,`(¡ÍÏüm√Ω õ;ûÅòÎ˝SlœLÌ˘	ÖµúæFeﬁXEŒDñ∂˛Ÿlx.,H∫Õì5;píh–®1Êº^™=œ∑Á*∫¥ÆÀÆgø˛¯Á˜ˇ„·€™=$©öin6Y/ı‘Ñz@d§?íæ%D‚ö˜ˇÅLÜ(_¸¡ıa€P*ÛæVã~ B™E,ˆ÷≠aã≠˚]+≈V¢]ãfõÅΩŒﬁì26ΩLXl‰≈û◊s@ó∞å≥ûÔY-r‚–â…=ü™Ú=òõrOEÁò˘÷≤˝PµG∆Ê¶, Ìá33ÕfÊÌ˜G ê†ânÃ©G¶f¯&
Ÿ∞qºâuﬁƒˇ>l˚÷+8ª˛LD|*:”'H±ï| ﬂ˚j¯V÷¬V*W⁄…Ü≤_áo>L#πHXö™¯BaıIL7Ã`∫˙ãë⁄XòVQ5ﬂ˘Ö√[ hìÒ6Â§WR[:¸¢Î.	2÷˙	◊Öz:OùÄ¡¨Wk¡ Uïõ]∆QR—˚Õ(	Õ(é∂B±ÔΩO1*>È ¸˘’Zäo_÷∫…j√Ë‡Qœ´ãCÓXÂ•QXÄ*b˚†åk˝
ã::Mî˝8â0_À:JóC:S â/∏]´√ÖÅFª∏W7?a3?¨?ª]îö•√éuµ=≠îô‚ÑùCÉå_eÊB*eﬂ¸;r!ÿ(vô;öƒÍ	¯ïÅª{ïYé–\PÌFcg/Õ-oÆŒœ]æº∞≤y≠¨∂na$AcØc5<rss)ö±ˇò…ßR32F)a]£¡h#BΩ¥ÏÆÉgnËcg;õ≈“ÊkÜÁ⁄ùQ∂ Å±à=†ìı¯z–ä≠ønKÏAus^ﬁ∂£t°*Hwq∂ãè≥[ëY¿≤ª‘qîO6Qƒﬂúß‹BGk¿u
ÁıTïZÖóΩ ÀÏãcÔ—/~÷ãÖ“FT]h‹ú„πRµ:Qÿ∂Z-ñ
ÜelNKÉëz’]°xÓ–:∫ııç›@«>@´∞Çõ»n®∫!|	„ıaõ;8‹¨ïy )ôWÈ“≠JªÛ |=ø^/∆—:üâÄê™1n BVáàîÇÚï§ô)ﬂ°dÂ	·”1Ω_¡∫Á7œœ≠≠]\ÿ\∫|Ò{$˜“´´kŸl–Á
E	ã•§Ôí‡7SÏoø‚ãΩ\%ÌÊ,ˇR)˚S
◊Ë_”Ã≥C%90ºMÊqêiQXB®´f ì"•4!lìdñ‰’!Möp6˙äÊÖÃ~'Ì¶¸JÙsE£ä>ÿ»#ÎªôîÉxÜâé†8U˙Ñ¬Ω&∞U2,êàîHO[ä^m)Ä∂˝
îáBp@˙r;;˜Í⁄_D	ßÖzø«ÃΩ,ßÙ2[ö±”ÇéóprÇõ¥ÎnÆòçƒÄˇXÈ·∆cR·H·sh´èrè¬ÏGØ≈Ø∑l◊5›£ãÒ;M«ÿsè.h¸ƒÊ,¢Hå87Ís˙ËÜŒﬂÿŸ◊`7\ÅJÜõ#-Ÿ'LK.ßö2ErÃù¬ÿœ«R>Ûùÿe6wätÍ&&|˜—ŸÊ˘«8üá0Øó¡ı^0<#ƒ)¡	√Ä”g¥Æ(°∞ôÚd\êVñÅã;‘«Eü:ÖÑ†é∂‘'tÆ¡j‡=™ã“•ƒD™¢Erß‡ëøÏÖ\gÒZòÓjËiç@˙ÍË-äPöú°îå;Ü@dIπBÄ\Nü7ú˘]ê/*æ{b) Ñ%%$a∑|˝ÒOﬂ"ÉOﬂ‹ª¡œóIˇè77>§8-ÙÓEÉ «7!°%ûE	≤¢«e…(^6ÆYåå9∆ ˙6S~ˆÛE~‚1-Ñ9Fí!A˜©Ô/
˘ôd¿Dg˛ÿ2VÆV\îTMYÜŸÃuÒ¡ÄOÇ0ÿ%yRöÄ«îÎØiπzÖ∂/˚QLµAEh+¢fûr4ÿi∫√ê≤g/SπVÎƒœPïëVk<c(64∫TãöË%iº–m√ﬂ.ã@K‘øeRˇˇoE9äe†¥Éqd“ã†ÇpP)+£
"û°YùEB«Îxÿ\B™˚ŒêTwˆâÚø)03∆∆Ó/Bçë‹⁄gZΩ©âT≈‘3hÎ…Óc"Ü%ì¿…,
÷∏ó•A@´°üò∆	•≠ëèO£u»`àáÿˆøåﬁ_¬ÍÉ’
ÏÑävHRzÄÂ!·óóÁ]í£ò](è”ûƒ˝«aU††„r]¯S)¬rdRÜ
Ú(¢ì1”Fæ—ÊÆ„€´I”¢çÉ^ÿßò/Ùœr$À´ö`ﬂ$àej°‰u%¬»‘õêπJ8üä/—¿SÍıE %ËPIiµQ`ËLF,D∏f®Éz8ÄÖ˝£ÁØ‡§wÂ◊t%ÚéhTz,µàÇ‰_‡páÅ_>5^o;‰Uäw ìƒ’˛ZÏ,ıº1rƒõê˛†™I{ªVÀ|9˜ô√g‰6˘CQÄgâ∑OQX]Õ§â)a†.ò€FØÂ©u¥å™sõ\„8ÿã?kj:#Œ0bù9Ø‚FÃUÕ4)&‚÷ñ"ÕnãﬁV¥=e«`˙%‚€È7é®°SÇ{Úø∂Â10πdd—„_P@„ˆ*jTé„â~5ÙøBUôJ3Bleà]‚T?‚ˆ∂1jµ	`Õ„ÖB>ÂÛZ∏jÙ#es∏fX≠`kÌÂ˝M=ajˆ@ûŸœ∑[†j°|˝'É3p:|ïÌÊùh)éX ÿŸƒ¿Ú‘Œ¨◊∞‰a:TÕ–°∫¢C4|<ËPu§io)√•5+znH`G∑î)5y∂ÇÉÅ2mI⁄ £ö^I^≈¨∑z4B]πxK,~˝ Bì]ì˛™E¸	Ã->ô°Ã
‰1Üv®,BßMK€„#ÖÍ4∂Rä“èd≥ñ›ÈCm,ûà/˚*M§®&ßsZ¥ñ”V{G5Ë:ç3á£fgÙE@mFF}ΩFÀ;3FecïÉ<ˇduë¢‡mÍ¢Ê5T[≠}‹¶MÂ(≥Oácnõ ≤9À6-g∆:vﬁø§+OcâîcHƒœâÁàv2o8^¶Èi≥i¶N(0ô&ÁÑ£ˇáXqë=4‘˜)Èπ$Y´axvóÅ?*≠√®wŸπz=üy‡ Ø¶ºˇÿ£%ª®$Ö∂v¥@D¥Ò.Î)mæ›¡»Ò'àí˜®£IU<°¡˚f]º Í8é›J±m%0_6ÜrP«Ë)ä⁄D> è∫èNqbD§
å⁄ÿ2”P!«szùÜ!†¿P˙œêªgSt:—n∂å :K|eÒ¬f∞¨.,dÿ:ûÂΩäGöÛ†«Â&éÆ$,ÕË/#xzì\^%rÒ…»20AıÿiThGRÕQƒÃSÈ38Oa2#≥7Cgoòyä+0i3ß;vl◊ÃWk5Òdxyˆ0«FñZ†Ë\¿t”C⁄ãloÆ2Ö%)Òóæ 0øZ{GoÏÏ˜G)F}™ΩÍ∑›Ì∏£4z©qHL¢â#UJñZ‡-9ÓE»(%oπª–?ànÙˆ∫%¡>XÇXÍ∏!(ºÆ∂âV†à›ß01€0£Mvú m¸uÙ®¢t2˛∂ﬁ(¢ÚVz,6ëq◊lmè?ìHí-›G‚ì“c
°õfπò¡ínÂ‡}N0rDûH∑qàè?µÜÊY¸Wb¥»ÈI⁄,2HI]ìêûÆC‘ÏmQ¨Ö@¡ïUﬂ¨
ØﬁÆR”-ŸWXØÍ¬∆umáÏ∑[˜ÃÍK†.ÌÌÌˆ*€ŸôÇ•XD˝hå÷ú´î«xûFˆ7Êı:oÔü√hÛr˛#ËΩç:	Fr√í≤Ø¬r+>U¶¸´y^f9∏Äu√Ë‚· åi‰2¶≠
ÆS”Í5¨&$ÙWæ±k˙±”p,Éè6l Nœ:È¿
ög∆.øÆìR:’ ◊Ú5§ ºø†Àö°Eù42∏Á
›]§…ïãÁ
‘Ω◊}ÕÚvs„]ÑÏÛf«'G?Qã=â©·e”±ÛœFö¥¥‡v[ñóá÷≠ó6t∆àI¶ÙN6KÕÍˆÃ‰ˆv≥÷l‡ØÌ≠m•¿Ã?T∆˙ÄNó*¨ÛaJ2§ç:vÕ$S•bX√Flê+[”ÂÌzíIA §ßõ]a$ÀÇ~≤€4Wµ jT]ÀôC‘üLäÍIU“vSâAöÒΩ•W3HTjˇ;Ì≥¬∞ß¶˛…öÎ«oÏb0§Àùn¸bÀÍviˆ.u†≥r3(¿Ï≤›Ìu#πáí±≈.ßÁ0a–˙≥≈JÒT©º!D$'≈ôéÄº"∏∞wà√èwUCC¶"êß"©ß^B˚e‘œﬁ§∂´…gK€Âô ©MÑƒõM
V¢xãâcâØm–—#d∂ÍòÌM¸±A÷Å$oQÄƒl¡‰∫ÊfΩ¯¸f˛˝Ö#œÇH∞y
˛à‘Çò4Å3xπ¶∆uâpäåÄ«^~¶$0STö∑Q≤]PWúıRY˜Aı≥$|ŒÏ±¸±q¨Ôì7â¨≥Øxú“z<ò-π24mrV√Ë“TàC'VöNÀ∆ù‚„ë!«R©PN´DÀ "Ÿ£ª#ÏÂ´™?0áJ6%Öz0œ4`^≥h‹:˙{h6NÊ˜ΩY≤gi~TÍ®{V·«©2¸òAD»RÔî x´T≠7tj>òò&Özñøµo∞™Åt'I[˚¥à0Ö–Fh/&e_äˇ_®® â‡√¸o“FC<Ü“OÌ>hg/¬˚tú“F†P√æü¢?kµÌ‘”)Ωª∫iÂ®slÑ_5:JµhS±∏™u™ô⁄ƒ$ÒüEwRÛ-◊pÚfJH¯ËÙDBç≥⁄À®≤>Õ˛[°z’≤øhìW@hç£s£r¢ BQ≥^Ea÷K£çh	–Mœjõ.[≈BïÆøTÿy©È4"L‘c§:≠ '¡»†ñ√∑ø‡ûÇË]PE‘πfÊ+ÕquFuáaŸéôï¢è∞ª•Oû˙ﬁdJyòÑ«õ)ÍƒFB=O‚·ÂbzO~•Jxnœbçù	ä'/ßÇÁtj’ÑV1¶	t€hòﬂ`˝a∫ô@;>…ã_Å¡ÓÅèóÍ›}Õ¸ÎÉätZ¶élZ˜∑Œÿë…⁄1¨Ü.ûGkK’Üo%⁄>û∞Ò#iÜûà8æ˙bı<d6òoñó“„RŒK—πÌ…3“rµ:YØLŒTáÊ£ÜıtÛ–`3EêN&Ö‰@mö;èâ√fc¬`?i9åV¬2»âè∆ùﬁDôuTü∂H•*Á©f£\/◊Ø$◊?;ºY5C’‹ok"©Ó¥öu=˜+>o{∫.ß˘ã˘E<>ß±l¨ÌÒ9ê%`æÎCuµØ…÷“∂õÿq√RÉ4FÙÕ—∂`Ò4ß≥dvm—à¥c®íEÍFì#o Û§å¿* ('¶!C,#œMíQiΩë◊ù|£euÛx#C“¡è%°Qy¡=ëcèR5w¯	v0ˇOz9π‚VÑMH ¶wò0bﬂ[zÎ¨¨—N,-//]^∏º∆.≠*pÚ}™V'i¶˜∫˙‘∞!B€ŸjE!∆:l™f{cÏÏÚ “⁄“¸“≈Õ≈ÀãkãskNOuu´2iÒ%âà‚j¡†5∫ˆhæÒk±mîô∞¬◊£ü…P%ŸAùK¯raa~Ò¬‚Âó»⁄´+óÖ¬…Á#∞6üäŒH-Ë“¡EÑ⁄7ÅRVññø7˙Ï®¸∏Ìæâ>]äπN>tI…$ö`D≠†Y~†5CÎ€"ï·†Ë◊È†{uœ4„®‰Í∆ƒ§‰®A>‚mLn¸ê.s÷,©>9}ñ∫æRqÙÍI54w◊l∆Î´E0C#æ’™Tt7Z•ô©•NÎK ∂Ùùuí$´WºÉ!˛T∏&ïn@!P¢‚b‘ÎHíÑûSWk∫IÑ›ƒPK«5„∏â)˝›√hÙ]ö0©è[¬°RÿoEáî]◊˜22Òñ√≤cœÚŒl®…¢Pñ.îà¨Å8ë%¨Ó—‰ì8 ƒû∞%D$ÑÓ÷@∆&¶#JÎNò€P8PN<0ÇΩ0˘¿H ⁄√„õ"=øÿàeq?zOWxœ1ª¶·Õ¢O:JªlŒA q˜ì@I£ì»˜Ó¯TîïSÅQ©ôÌŒÚ“‹⁄¸ÀóÊ^Å5IªPoJ‘ä[UÍ wŸœ’≤m
∫⁄◊©o}]K™V«’≈pOëé6[˜Í˜.œøº≤tyÒüP§ô_∫#C.Ã≠Õ°d≥Âh≤ãKsTb√H`Wˇq≥∏?˜¢˛ùÂïÖÂπ|Î¬¬Ú≈•Ô]	*9·“Q\åH6IŸm˘Ó‚[=.†[<ÜÓÜdÕﬁŸâπ<⁄¸Y|4t˜-∆]ûSè˙ãâx!Î•bq#…5\ùª2˘‹ûˆ¿›µ˜∞ı~?5Œ⁄i«–ƒOÆÔÁ˙35g–‡≤b¸#{›À˛—˛hUèû¡60	"»õ>Ö-’´E9l”◊bîKÒ⁄ﬁyiÌ0w¡!h∏£≥°€BUÍØ6dlåËµfî∞çÂE´%cˆ∂÷l∞7Wˇ•g4µ˙Ô12B^?ñ≠"4;°]´f£Á ﬁı˘É.î8KXˆÍZñf∑ó'í¡d˚◊	3â;v´µe8ËW¶o}îY1√iN´πØ¡πé¥à¢…¿≥RZÎR1à˜0≈›9ı*H÷€ñ„z≥òãí†±t∂Ì¿_Ü€E”·zmÍî.Ç÷Ü	ÆÅpìm∑ÿ¯3á¯3Ò,xì{—n\ET/t≈NyXk˘@Ø_PW"∞0IáyzHƒ$*âCáßæîlàïñºU“'xy:hPêFpº*™Y1}zÕËF<¡4l;Dß—ârPPawÀ=#mwjTP4…≠nÔÁ∆ΩeπÖ∂µ’Ú
{äAl∫ûÌ;ÊîªΩ?UÆ’ßÈÃ€âe⁄› ∏™U“œ„4Iƒ+ÅLXíåäZ:ﬂá(æuÙîM É´`ÎQ·T}∆&KJödÒ BlV$dàáM(ﬂdÅÕ¬6√
â§≥,»´ë$ó™µ£rÖ\QK’#iv‰˚∂nﬂü$4ASò∏†ºé…^P–Ö≈’Kã´´õãó◊.“Ç@L˛Ó‚¬kõæ9xÛ¬¬¸+1cp∞¥ Ï4ÉêÍØ-pz*Íª˝wí6›,¨Êô1tÁŒoŸ¿†«‰Ì≥GÑŸàìuΩhî™2{£.à»%‚∂gÒa?<`˚a`D@vŒ∏%©'ÿz(0√∏_ÅFí◊xo≈Ív·¬uEP`ıÎ%ÍCÀ≈bò@ ã—:ÒY)6ÀB)À≈E`˘	q
h÷Eﬂˆ:ıV˚
ßﬁÀI—Ö*%"‘õß÷ÀE yvÉø¯:r˘¢e4ZÇì{ﬁaÁ;É+ O‘ ûØ{®6‘ãc·ë`Â∫@ù¨…x±PqÒ‡˛±6ì;3’ÃjJ3Îäf™%	!¬C'9‡¢{±ex∫CÊ-ß—k¡“£ 34mFûØHÜí<IéõæÚ˝ãÅXΩjµ"	ã•¿‹øiÿ¨¬gÆ„Ëíå…ÿtE¯·≤~ﬁœ
rˆ'EO.)‡ì)ﬂQiÊ¿Uô‘^®≈¢:˛amÅuÉ¨Ym
÷_í«Ãÿ^ÎÄ4©ƒäô^0]6OüÕ”YªÓÖÆıêÀﬂ]X°ã∞et]û`y±Â„¢∏ìÏ˙ú‚µW‡…p°e 0‘ßi£XõŒ«Ö:∆ﬂ1·6Óã@dG3Îˆº◊†b{ÔÃa•(ﬂv{çÜÈ∫óz-œÍ∂,î	KÖíÙP√∂[~á’1+$õ|‚¯“Æ?#ú≥JMvó≠ú…DCR[|œ«+óìAØ≤ÓÇÑ⁄z¨îUÅ	/≠@eˇ‡ô·ËàØ…B$ºÇœ^có›ÁPË§J\\‚1€]œlŒ"ä‚¯ÃÃ#‚,¡í
‚%açøÑä]ÿ⁄Y6W~ˆh"÷£ŸºhÔ‰º‹∏{–1ùùÉÕÒ@úfïéOP'…°P∞XIê°<L(»Ön ˜ë<-/VKß5ËfÇ&Ö:Ÿ
*3>å)ììyÏ∂°_fS∫åc2≥ñ
NÃ8úG+Õ†Èñ' %•üq°ñ_©÷gI%œY}œŸ≤	E-ÂuÂæÀÄ°ÒÃY•ê]I”õñªHó∆"9E†nz¥MXmnRÃêFëDKÇ∆Ê∂I‘ø⁄v«ˆµ≤í§ïi°§$Íi(≈R>®¥:√Ô!ù	 +˚Í»¶⁄Q?ôô≥ör°/9¿Ë7Ÿù3<∫}hÍ≤•P£*ZYNl%Àm¶î´å}≠Ë0¥ò:5À˛°RÊõtKêüÂ° ¶J~q•ˇ˛‡G?¶y/ﬁø3KéÔ‹|Ù9yÓ0“{[
ÈÕY2œ`“ﬁ»†ˇ*1≠∏,k≈jä	îc¡Õ6rË l‹´Zmôß—V3æN*ˇà>8Áó»"®\YOÈ1Ÿ∏¢Å<R„¿«Pärvg-‡úÂ|ˇ˚∏3,
\hB…Üí!äGpb—ÁÁIKÕì≈ñˆ§mbÑEÄ«tBõ$(˛¨.E–11“+àÕçÆtÜ„ﬁ ¸Æ—"g»3‚∆¢À%$ïû„ØksµkïX_Üá6{	wì…˝õpı%ÿ‹ˇÛÍ“ÂCb ◊ı[q5%ó^ñÙ†¡ó*˛ﬁ≈ﬂjØ¡ÏòjDHÚ˛óQ]•MŒ≥{ç›ºázâò4¡ ‚jfƒ«U›C=Ó ¯Ü8\≥q”∞!¡&"Ó35},Cm≤Tõû,ï0≠:û‚£_˛

õö÷û>D∂•Zñm)j1]@Ÿe¡“d9Ãòô#ÿÃ"¢ÿ9åPdv|tªˇˆ˚<ß”“eí;~„AˇWø%Éõw…‡ìüÙo~6As<aŒAz˛‚‚¸+æ¨Æ--OåSG√%ø¯b¥Ëõw˝D, û[YÉ¬ïô*‹ßÖIìœåâô>7 ñËÒÙy€SŒ$€]Àı¥ìÍ$`Ra5°$⁄ií∆"û[Òäû7Ìf∏u'à:¯Qé¢⁄G
7„Ù<ÜV
¿Y„iπ)Ñ0·@8ä∏ùpò“V¶«§∏.∞9gkÕ#qZ!Û•gaafëÒ#≤ÜÈ¢ƒÍQæê ´∏¨¡BïHäÆ/∫–`çç´ —'qÒ≈∞¯-ùïîM7Ct®¢•Õöd\üësÎ¥õjDj-•®0ßëàeÓ_-1œzQÚÀ
åAï>Íqúw˘ƒ©¶DÊ÷˛:µo\ÈjöJñ:ﬁ˝ı«ü¸åDÿ,„ÿ«ÔﬁyÙ>OÕè ß&îÀ2ˇ∞Òx∫e¸Ëπ¢ Ω„’ ”é÷ìõ4ÕiLÜ?B„Eπ±GÁVË9öŸ$ÃÀµu¿·ë—ÇÀ¨'åúe´≈aN%x3‘∏fX-¥eÚJŒêsÊ¢e±Â\È=ﬂ7ç¶ÑõœÎ–Æıü¢kãﬂë_Goˇ\l™TÑ»^Ù6.∆WlhÂ¯∏,íFûYËhüYÑé√Õ[òÍ~C›ÊqÂÛ"dª‹ûÂ5vâﬂ\ïÑO◊JiVAÑR'›˜¯˝w»Òªün¸.÷⁄»¨G+ æ¢Ÿòû(*_HÍm[§{—„Ø)?cçO*
ÈF˘AsLxS6aÀ1ç´ÒtT FeÓø„®Ó]¸€WYFÂ5®œÏ†¬U∑à `¿0≈nÊq	b¸Å	|ÖÉë	@N<4ïC”ˇ˝ı·fu◊⁄ˆR©eµk8W[fˆÅ	œÉ°îî`p¯µ«2<’Ï√ìùrÿ§<f∂ö‘w!Û	Z˛ÒKë!‚◊À’≤/.§†{Ô±∏÷@~H¢5™!„óßyÑÍ√1Âl#DôÚì†oé-ü B9_<|¯pÈu2¯¡˝[◊_>ËˇÙn¶U∂≤ÁB«l$–
Ö"òoÏeü–i""~)2J¸⁄c®È°™ˇØÜ•UD„~¨É‰∆à]âªt≤äÅN3	≥iπh€•)=Œï .ﬂ¨8*1ŸKì£Rt ÊbŸ—„5~£MKûÁ˛Ó:ØhÉ%;†Q⁄`}Iô‹C≥]Óh∂«Mû‘Ùô@Gq‰©ŒŒ±LÉeiY“-°≤ïbﬂè˚íΩÙœj‡»-ØÉ>Z[{“ÄÈ4Ågu‹7†ùSm"êÃu>—°˜ÜËRß{:+íÕ∞ìû≤kæN±Xáf]e¸<#ˆ]˚ÍÊ!WIxLH$ÿÄË˜S*E0op«ˆ∞?ˆûΩY;á‹,0ó!j(?Âgç”ÚY„3≤Øe†õ◊*·Ö±®qLó˘Hw‘ó–ªßÃÚƒÉ"øÕ(`ﬁ)t2L †ÏÏ˘~4°ukOwï»—˛=LÇB˜Êò3ﬁ"Ï°Nè˝}ﬁ†€ôºÖì@°îdüƒ_ò∆∫Q’Ñ®âë‚Î4quiu≈¸*q!îS"gffx8‹Û~4êñ*9çPW≤Î¨˙D,Ê˜Å¡_ÍU¯$$˜7+EÂ9^	œÒ“Éh‰f(è·ÃÊ\UPÂÂà6à7<-Ìx;¬Pîãrœ-£4É`CQÃif´—Ö⁄˝˘É_d[Í∫Ëæ ÔO4àÖ¡Ó˚÷Ï[r–üºJ©PºGÓMıI.Uœ8¶’Ÿ∂ùÜ…”X’Ω‹8ﬁﬁÏ:vªÎmZ¿J`ø}¯4vrÈ≈∆.*P‚{*ª∑⁄—Ee◊»wídÁöﬁ\§ÎÃO2F;íÑI§ªí†ÏD®QG~qBçÑ€…Í|RèG?^ÂP‰ÒsÇK}PƒÓ¿4`È≠Õ-Øì4Ùj#6'Û®∑ùm”Ú»º›Ÿ∂Ê¿OhO∂ÕëxºàoU KÑœO+ò9l/ï Ä>ä2a{—£ÿ´0Ïgxz‹ÂF	^Ø°ó@ÎìJ’Ü±Î”0∆¬€˝’Ç∏›|ùÔ√¿O˜"IG`€C¨ÔÕZ∏ÛUf&Î”¯±P∆çOÃ{·Éó‘µqÌiõ3ﬁ≈‹™∆yF$Ó\‹üSg∫Õ#®£C„]ñ‹Tk∫~™6]¡ÌÉ…î˙áö˜jp_T!˙ßw+±≠’UM¸¶£â“WÔ| ìÿG_¸˚£á˜	¸{Ù«[‰¯˝w>§ÁØ7Ö¨æ∫≤≤p˘¬¬ä‚îˇÙ‘nE—Ö8öøy\r[Ú˜o4»ÿzÕ<6∏˜nˇ”€Ñu¨ˇÀØxﬂh˘˜˜Hˇ_Ô<∫}pÛÓ£/Óﬁ˙CˇÊõèæºué‰éo}÷øøˇãªd≈ù˛Ø>Ôﬂæ”ˇı}Ù–‹{cﬁm“øgpÁç˛Ì_√+˝õüLh}âÁìÿ=‚ˆ¯{F«#QƒY∫∑kπ∞Ω∆Ó9<av{-oñ\¥]wB® ÀDe¬@EÔX™äŒçK´±ù$∑mÄ»ßT•„A°1NÆa\Qóï∏œZ KÑ	‡A ê
—[(#Pªä;åò†6g†®–±7õfÉ¶nDî«Ê©°úLùe"˚å®Ω[ìÊIÌIÍ[Ò,èº‰0TEÛËìvNq`(IÚ…d|`œSÒ∑H[Äµéß^L&§p˚®¬ﬁ°ﬂ@4P•ò‹ëùÙLw”h4ÃÆ#=N C–^jÜ∞¥Î⁄5ªã¬¨Áÿ-óú7úYö¯j
	pí\2;ΩIƒ|.'	µ’LíÂ(`RL_Z((5Y0ãE%àefäô,jΩ2J4ŸÉ∂}≥Öò(4Qï#zÍ˘°	bˆ{
G¿Ô¸%{Àjô∞Ïƒ"83ôPˇr€≥™∞,µˆó W–È(àìTª’´ŸéÜïpü}U923“1Æ8Y?Iﬁî$è£Õm/Í»°¯ˆqÕñOô√LÎ±mO`M°£jjTXFg¸≤¬ﬂG¸ëŸQB8”8™|œ=ú∆ò∏(∏XèXF	ÕqÏ=æ§Ë°BÌ(&zÚÛ˚8rÄ⁄uƒï¬ó¡bÁ%®ó≥n	|+©ï£vˇUÏØﬂÈˇ◊LœÅÈÅZàë*>ì@•!.˙7C®lØ¡≠Ü¡'ÖﬂüöU˝ÜÑÃ˜'∂¿Ø!†:EÏ}dDU"Ωπ1äj#Wµ!∂¬È¶LQ’ñﬂ*i_ï⁄◊t<® ¶&≠?ÓÙÍˆ£?1sè-Ä~1QZleÆôN€Í≠Ñ’Ü±∆->T≈iNÑ
•5…Áad=T√ZˆÚàÌ\çX”ïFÛäå	#D¡ƒËÒœ¨y‚˜„áVöﬁŒÃ‡ÃÃ|«]∫ùı»B"ï¶¢v◊_°>L†û[§-ÚY√U€pƒô˘]√Ù
T(∏vÒ∏Âl_Õ—6Ö‰ñ∫f«òÚo3√˛ô≥DwÉûZTAÕ¸ìbÇ≥lã.H/[É
√v>eBå~C@ü

 ∆|+N¥7¯S<ä"hÉ¢ﬂ!R¬s2lhIiá`Òß%1a´´  ±«∏sHë´#Ô±Vû#W`9ıÛYˇ«Iˇ˛€‘d˚Ê=2∏Ò…‡ﬁª$«∞f…s»º∂∏í∫S`s»Vœ!Ê!›P˛¸¡;ˇÒmÚË˜xÙ≈ØèÔºÀy[“€MsV∂…£õ~˛|øˇ◊Éü=‡ÔC°?cˆ?æ?xÎìÒ#2≠RÖ÷ë•Àë0÷Ò£â+±éœ“éÀå&«ô«Hû[{eƒÆ^XxQÏ‰˘πãCv/a”ÉnÚXoçN”Ôo ô”y[≠"/IìqC§∏X§Ö[YÇ{QÏ≠Cœ’hÛ$ÃQLÃ“∏dÑãfXÅdﬂùµ:h?AïQG»V(#&†]ez∂Ï„4D≈li”äëÙ5k˝ß{>O¿u¢p/PMD*ívÆ¶˝8hx«FLQJß5˘HIeº®Â#ÄPëm¨ßá$b—jXë'{Œëòç^á,ıó÷w‘\cp,QT‘ù≈Í¬ﬁ´—Ûó«à5FÒfK”•*‚ÕÚ:çæ†Ÿ∑®^HWÇ«ƒN˚Ì´Oñ¶ÀìÂRôÎﬁ±
Â´±Éﬂ›8æıC2xÔ¡£á˜ß˙7ˇ/ﬂ& ¡”8¿°W ã˚f¸Öt/®”óL◊Öñ!ê'º∫kªûc_5_≥öﬁÓô√r!°C ≈1†˝Ω3Õm´’
Á§¨ŸK36ùFun—∆√«àÎÖOÕFS›Zf’ÆπÊ5£„·Ï¸Cx
Y¡åñ4ã‰ÀØ^5πl:YVÉØ:®ô¡5?]˙W®jçdE¶Û-⁄êıkö€∑~Ù„¡çﬂa<¸:˛…]r|˝=J>§AgÙÏ"FG/ı¨¶9Ç]K™K]zöÖã˘.˘+π∑o˘+Qaﬁ  ˝·…x\¯”tàˆÑu„‚¬•q%V€<ö°VüßqY}ì[|6ç^H’™7ÛáÍ˙£—Ngﬁæ1¯˘ut‚B}˛—üÓæ|üÕÀf´ã∏•8ç#úŸåPllA‡≥—Ω±«˚÷0ï_£±(ãù<“*u÷„7<Å¸ÎÛˆ≠eÙˆ¨p√Öö¸Ì¯ó©/pç˚Ôªí/0Õ+"HÁ~¢¬·|”j|»èxÀª[jø≈ëPâ˘ª‚ÏÙPg∞ºÄ®on∏˚˘ﬁbíknZÚ©‘ÉÂ≈À˘óÊ.-êKó_’Äl)p5q5⁄_µÀß‡Ãê…›ÖØ¯)°êF>’√3Ó®9äÉ‹È&Y:õÏóB‘ÅÛ∂28Ÿ∑¬&ªjzΩÆNqjnù?c3¶ˆÊÊ®?iÔOŒõx:$P@™—˝¢û™ÄÏËè+i+ù_IK¯f$Lˆ§Æù'·nQ[w}∏Cl^ ÉPr% jˇê]s–¬l∞í°>XjIü◊´Õmñ§|Há_â∆u¸<v÷Ÿ°qê‘∫îû	0ô8…0ÃﬂÄtjzœ$ËP„ñªÕˇW˝c M>Æf∏«èå&\œzîõ‰Û√>C âûå≈E·ÍÎiz:êzf?Œx§‘ú¿êe¿!øº◊ˇÂCr¸£{è^gl1)úƒ8b
O§∆π(“màKQÕ¿$HØ¸®VáÛ™ÁhI—.≤ó>˝À@≠B¯˘€ïÄXä⁄'-˜ƒm*
&]?KX°èæ∏5¯Ë∑˘0·Â∆'˝ﬂ¸ê“6µ∂p„œ(˚sêÙf∫2ÇO«≈ë;oÆg8VØR–2PÀS"¯áÌJñ˚G£IàDYïâíﬂõf˚ñå5à¶åzí∞¸◊%ükp-∆Œ~˝ÒÌˇ;q;H Ï˛o>ºı…Òç˚∞Ì‹¿ønﬁº{£ˇ´œ?g{Oåüê(.¿Hˆ∑±≥ÎKÀó7N∂®j≥di{è»¬~◊l“I|JVSÿ†'±öÃ∂È≠¶z9˘7Âıº$,(ˇ⁄ﬂŒä˙Ù∑£Æ®¡ùOéﬂπ—ˇ´¡á…‡Á∑1ú¸[Kq2|Bã…ü/y5-œ≠≠,]<·zöôÂZπ≠∏d‡nuî,ß†]ºYObQÖ˘¬bKä›íAXNÏ ﬂŒb˙…OF^L‘DÙË˛u“ˇÙM∂Q¡ﬁ;˛˝Øü1∑ôü®±H^RsØÆÃùlAÕîaAŸ{ò8yõ¨9ñ—zZd=⁄*÷¢'±í∏DÆ\J¸ûºñ¸WÑ≈ƒ/˝Ì¨¶˜æy5›º€ø˜Ÿ‡√;‰¯?!µ‚‡·∏cXÑ˙û–˙<"hu~·Ú⁄	ó–©Y≤j6ì∆º¥ª‰ºm_}JkmVÜ„íˇΩ'EßÎâ≠¢üﬁYe˙ÚF6§¡{?‹{ÉnD?¯%æ?æASåø—ÌhumÓ“ÚÍ	WSe÷∑6≤c>≤÷ÎDa4Ñüﬁ£«—÷Õ¢\JÙéºíÿ„¬B¢˛V÷—ü?xˇ?æ}2Èé>Ω>¯Ú≥õ◊	r¸÷›˛Õ}Àíﬂ‹"ß¿'¥îÇ1‚JziÓ“˘≈ë˜•e€ı¸tŸLèf‚&<)8…AáÊÌˆñ·ëM≥ân6Ò MZ…_¿¶ç-gÁÕMÙ%~Ç≤_ÌoUˆ;o8ÛªÜ„UNbÕN^y∞ˇΩE∏˚ËO_ël~Øüˇ¸ÈˇÒ∆‡∆á<â<'“2ßâoVDÑMmm‰=-›+üzW?5Îo(W˛QóuŸV.æ¿Õ^\zÏqa·—eÀ.ÍÁÆXs	~Óºàƒ«]3¯ˇ˚èj„ û»⁄Û{YyËe? ¬˚K,úl b¯y:œcjJπ$ÒÜ,v“áÖâﬂüí”ÿ8÷≠j1ÈÄµx!âg±qˆ¯ÌœÒ◊â˘∏◊S!èP8∏,«≤Úu•3gfÙå∞jö ë„vÈ^ëµ[úÛlsõ…=V·û™÷á√√˘ñÌ∆„îtpÁè$í›‡ø(Ü
µ-¬¯@à)≤ltÃ!"¶oS@ÑÔêë! ¢B°QÄG%‚WfäãêCQ{2q˙báå8UTådYJ@—ÊµÄ¢'ÈÖÈ	?£	æ ˇn~}∫xmó›Å/ı"ãì√9¢∂∞n	≤ÉmtI„AsÇº"!Gr».ñóM£…PÃõ$N¡>EÛIŒCaò"#U&9HCﬁ°h3Ùë“J$‰/#\$øgçÃ'Äïã'@Ωh¶w÷SEåÑê\	!#‚QRŒCäüd≤’Ü*ã?x„¯˝_s–¥¡˝g'	sÛkãÛsy∂mrqÈ•dW≈·=S3‘D›π&[€˚8PŸë˝˛w,‘˙π™ÒoLÚp‘Ö‡–;q|Q\„`6õË¢”ˆp®Ùﬁô Nﬂx–ˇ˝v§˙9Èﬂø€˚˝I“øuΩˇ?XÓ–˚üÅv¬ºﬁhjL2∏wªÔKü&ˇÃ^∞÷s:˘≠É<Õ˘H3∞âZ;;¶„Ní¶—∆™õ÷ˆ6|CûÜ·‡è.<Æ»ÙG(`œ.'Âˇë©h"øNÓªÚKú¢rÎZá¯ñ˚’*S:
éŸ^è&yPTL«ﬁDö‹lA#{ªÀ…vÜë2ì¢Ï’Q›£ãû¯*Ëç2!2x&–‚Ò˚Ôpa‘4MÖ>¡ﬂìC’∫I°nÈ2æ<∫è5ÓMÎ^ü˚ñ4tÍ¨ ÂH°ÃA&øhπ^¡É√˜Çœ=Q$¬È†”†Æ∑Ûn√±[≠-√âä)Uªè·Q"QÈí¬ Õ⁄e;QT:K™Á#€çQ4ç&d≥≈U˚I´)∂®ÿ‚Á¬äÆœ!˜∆Ô˚∑ÔípÍ#z(˙#ñ•Ûì]Öómï©Üúã8f7‚&90Ω¬J¶ØÀKÃn€ËÊrP?]∂˙ÑøöQ†Iä·ÌÇ’<i∆Y‘¶Dì'˛‹HâlÙâHåñàÓ lfË´ÎÈˇÙπd±;¯…&ño¡J3ˇsŒO´J†¡£¸Ù3VÄV/⁄™Jz¿I!ÊKTB˚üY©#ÓÅ√êÿèÑûÑn¨/<ˆ'⁄õPÇå∫N$ÙHNôÿ•xßÆY	‘	ã2tKtfÛL£%uÀ®¶p˚-%Ü©€å°çÜó÷‰ÑFë ¨Õ™Cˇ©Z‹˘?Cõ„¯§”…Ame}ôöM$•'ƒü˘|-ƒA!›düêı√éπG.@ÉstN¨∂È¢3 D¡≥/¢ÄiÆYò\Aù$á RÙúRyñP˘eí~÷]Œ√à[ò#‹ûgF.π¿»;M·9ö8⁄A“Ó˜4c}~ÊC&Õ>î1„ËÈµ/Ω~≠Mtœ≤©@Y‘â6/⁄∂7îE•U|ÙF0ß¯íx)*âKqä
·çŒœÍÂ’óA—Õ¶ùÙVøV-îµˆÛ!A!2… —™
˙J/hGƒ
JPN¡'äJ©ﬂSG ≠4ö}<ı"zÈ	‰V¢lò•ßeàŒ«⁄ƒÊ4	Rô¥õ≥ÙØ*Õç¥^´aûÊÊ,˝R«§Õ±4ÁQiôHΩéái£ã:”8ıõ·t9ÁòÉÊÇ2Ä>ÅS]0)~LﬂµÃΩÆ<c`¬<≤‘Ì⁄<E}ŸË4'…<[6Ám√ÅoÀ–_¯Ü∑‰^[M†>Voû	∞yÎS⁄pÜÌõº2#Àñô~k@ù~“I`±˘]`ÔAÇà◊aπ>ß„∏Ò•ˇ«*–”øuùÙ¸ª©„[üë¡ù7Ô˝ñ‰∏≈¶ˇ£ˇ6¯ÕC¯ÈGÉ?ﬁ'Éˇı‡¯÷Øèﬂ≠˘˜˜ﬁç: C`Û·ÀcÜ%ËÛ1ùƒZSŒòÕO0S=_≈Aˇ“O"Jﬂ5Àµ∂`Ú˜˚ﬂ˙≥≈Ì“©≤AO9÷QÇ °∆ó$rœñÃÚLek8·$%¬.Nüáﬂ'6»:öÔw(ì»£Ü5K•5¸`~ÇänÔÁ}Î·Næ—≤∫˘Æ—D]ï˜€m´¿N©!åDX4…Xêãä>±tNØÉêACÀ„ŸGë |>4qŒÑògÌ‘lH¯•¸Ed„´-´ç—•6’ô…ö±CrﬂÂÉJS”Ùa/¿brØ¬ûÄ?Ya’Yr	◊<Gçëâä?∞åúK`üêÚ}åW~ò¿TºPˆY:C Zbﬂf¢Bí ‡§≤”	‚Ÿ)‰v¨é;ΩH†WQŸC-∑ê¥bÄ¸˙“Ú≤¬u"^Ç”Î Û‚<a}∫»;Àøó °—ó¢¢]ﬁı¸˘=WË ˜˛˛˜…¯¬ÂÖKﬂSŸ€5úæ)bÏÏˇ˚'ÕKg◊ñ…!ËŒë
C1øÁöŒ8π ÜKåŒ õû—Z¶¡≥'a±I˙|e-|Û¶[´VªáÕjFo¿ C˘ïÀÆäûJC„v\Ú44®ó†¯}BôsÂtl3eı/Üògø˛¯7Ô ≠ “[‹,≈ÔqJ%õÈs|ÚK•«ªﬂ\ˇ∫ìgÖ¡c¨›B∞}∫º%Ãpuäôà@&ûhÈ`Ze(÷D«ïóŒçôD,WÏd3&öI ‘*K?mh\HıÀtÄîS±4=ötí‘Ã°0•ûh°Áπ†Ë>Ü¶ˇ‰ÓÒùxƒ”ø˘9~˜¡‡sB{µ”FFÓ9>°Ö£◊ó«“õEãõ%eEN∂ì∂X•ãq?"é=uÍ‚èó_ëòŸôgÊa§]Ïﬂ{ŸL§o~tÎ—ÔÓOè´t\êT Ì÷ÀÂ"∂i‘¡2UŒb
$4&çsÆÕ≠ÏQyîm©—-QR,H€n¢Êfw/vœìs˘úÖnfòmPY‹jÓ+è–àÀtïfƒÅ	9√ì„òÕyxq±πO^G.ﬁZE∑^_ˆíOÃ§ØéI%µX∫ =¶'∑c„—0øùŒèª{˝⁄ûÔ	≤^õén˝u˙f&"¥vÇÔÙæ·v1U–zmÍ‘Ü
Ë7(¡\m†dÑ%£êb,j`˙É±á{vªLXıí	Äm,81ÙrflíNç‚U•’§söWπÛD¸ÑΩÅ˜ÑùCó ,[Ò$Ø-Út©Pú&Ëx§2yû\±õäV∆ΩªÑ˛M˚˝õv∂Yr 1„C•9RïæÅÂÀoƒü⁄2_∆Ωûœ2btÜ≤>_(÷“áEaa¢ãï•Ó±%®XH∏ A]5·ëg†ET†˛†(Q“Â˛gö∑˝Nú9Ö„dsÊßà¬TΩFè6€43˚B[ÇT’Ä¬º
LAÒ‰*¯¢z÷raLvÏ3á‘ BëXAmÅB@uÆö“Æ7¯î‘%˛É˝ﬂÁ>'«∑ná6çª˜Ô›?~˜Œ£/n—$[˜oê„˜ﬂ|ÙÀâ„ï“JìÏ˙Ëõ0∏√WW◊ü-÷ãÊ	8jÃN¡ÕÃ RÊ<¶ˆœà®´Ê&;)äπŒƒ≤¿«q—ˆ ≈änáîõ3Æ^∆ú∂ﬂ7JD-FÁ°F07õbÔ;òäµ âíüh,ìyj·8ƒ=ß˙ÁÔÌÌ#JrË1ThÿÌ©Æﬂùé;ÂŸ]{«1∫ªÖnggF–?>Y/äıÈ®<S+d´íŸjY]◊‹4ºMF$ìt⁄ff&K≈Údπä'|≈ÈâÕ‚Û£”©‚Û#’èp1Ü÷Ø®≠2°¥qM ØŒõÊé™πöòYç«*h√ô˚∞e{ËãQd&  öö4û|wü®¸Ñ˙…5À£ +Ï–2| k3–ıç¥Aí“Aâ@”2__≤„xRkÀ¨µh*lÁ˚Ù
^öÜ£ôê™ß6∑+‘c∫d/.Ë∞Ç
µ®R¬≤ÉI4Ì´¬
BÖ$ıºä&’Zp
¬Leˇ/™±lLíí‡Â∆ª¡ éOyy–Ù*V=UÁ&é»•πµ˘óIÓÚYYò_Zπ@¶˝˚µπïëΩH}.BÁÍ•û’jŒQ ﬂod≤cÇ-ûh)Lí…Ÿ™Mñg&Oï3Œ÷·&AﬁdÁ%´”1ùÑŸÀ:?À◊∫Ù¿Êú¢p=I˘«Dßñø‡ÙN2ô”µÓÊa8EèenØ^ ßÑä◊†9N€p¢0,âISvD–YŸπBt.Ös≈Da..î‡¡cæ¥ì_ƒ‹ª⁄PñÑ
çÆT('∆≥ÑØÄöæï¨¬â©åÅÙ,œ ıZL«® /êàjf{ÉP¬eNî{Ñ'†WG¶Ú¬FJ¸êZâ¸Ô∏õNØC°D“rª--åO¨7‰Dé∫ÛlôË¢T«∆ÆIÊ`[#/9V”?¿Nê}]j¥!Ö/KJa#Iq0`TôL:§å	p8ÃT¨J|M€™®VT)≥YoÓ’ºÖ˙‚¨N¶≠üﬂ¨¡?êmkÏœ…gã≈"
Ø—Zä*iV∑2Ù∆ò˝Y≤+§Z‹òîo∑¢w§Â†3tT&A1ÎöÜ7K;€∏2&â	`ñå±QKà§r
+ïj©Vz
^SO°OÄ•ö∏&„2htù\2¨Ûv`.{ñ∑K0JÉÑI—˚aµa;x&otê? I\E—C¸L t‹>›§˘÷«…≠àd˘ªÑuó›≠¿o≠vΩ∑≤ï≤ø;˚jÙok^ç∞¯GùÏ∑Ë”Ú¶caaıïµ•erq·≈5≤∫xa·¸‹ ,˘Ó¬
ëZ{uÂ2Yº|æ¨-≠êIøt˘‚˜‚p0á°„ lõ¯˜*2jfmBYyÆ2„≠Ï∂Œ¯ô_[¶…,»Ù(_≈.ı{¶?•Ç∂Î*Ë4ŸÕCE/sÍ"IÍRV$YËÒ£Ÿò˜µÊc¸(„sÈK⁄WËi ZS√?2è˚Å—INŒj¡tˆπUäGUπâ™.≈ŸÒ,™†û$WêeE£å"a1SÙå6a§≈∂æÁ¿kP&-Õ¬†—›˘ñ≥°ıp˝n∫‘ºï‡wAﬁbJÄ†õ	˛«a&‚≠&H§°HG»Ï´K-&¥Î8´k†®H2öxö‰LM3%«[¶lòËÅ˝∆«^P√>#ÛjH&ë¸—êx}è˘.¸ätêàâ>Ä›kcjxÏú‰ŸªÁlboEa7%‹5—!Y Ú$∆jæ€f¨\`√ÿ»„‰˘>Ó±“ÖÈ≠µ “ÂDÛé§1›P(	 ˛Ú¨F,ËÏLa¶ÿ,’7‘)U5˘X+bÜ‘(/|OøˆñAã±A«Éy<º◊MÖJ ïbπ/¬6Ô‡·}?fL¨Ñ•Vö,Õî&+ueÓuπéKV√±Wwç´|£M5Î‘+ST¯◊Û‘-ı7£|Ùåÿ•8c ∞q¿K¡ÿ˛ˇ   ˇˇ‰Ω}w«ï'¸ˇ~ä-á`DÄxÁÀä“°HH‚Ü"9e≈ÀÂ°ö@ìƒ
@c–†Hö√sÏD…„±ï±ùÿ±úï˘å=∂3ŒYŸQ2ÚnÚ<ÁÏG…üx6·©[U›]’]U] !èΩ€âmËÆ™Æ∫uÔ≠˚Úªﬁ‹¡úL‚¡∏(NÔªâÇ8a.Dá\ò∞,`⁄¥ëI•3õ#—|ÑÌ Xÿ®,íT9ﬁ¶7¬¶Œ)à#àf
ÍÅ
œáe._úAÛXtπh¡TR™!üºÖOıÛ4Gï˜ú ùÎÆ-=Ôì}©t;≤Ó∞f	}]êlKEU45|	\qÅ
SruQ°_˙÷¢¥‘QØêöò‡“[?6≤~]\££@§¶X(\Vz:‡x›`Pn~™©0(K¿â<õkñè¯•–f∂XÔÁkÆû~õı!ñéË	IﬁÆ;öY}¯9⁄@Ûk+Â2ZXπ±∏<∑æ∏≤å‰…S±ÿ™≤ﬂ∞Qö¢π©Ù5i¿Zæ˚¯ã”_ä∫o}–{Û!ÍΩ˘˚ﬁGo£g_qzˇ˛9ƒF∑%	ÿÌXM€ŸwÉΩynX©Ω:ô=∂$™R\ÿ{\Ü Ów¨:*UàÌãÁ6”3ité>‘jrÖ¨Ùußn£óú6ûÿAÿÈåıukQœÅ—(F£åc˚ÂtÔNÀMgf¸W+ΩÚÕíßñ(Ú7X•eólc‘ÿÜ4˝ø˝ˆ~|ã~yá¨ËQƒ§g&h}e}n	ïÊóWÀ•Á…P∏≤ZÉrÿ\Ä˙¸—ßÃ»®˜¡=¸·œΩ˜~FŸ
˘û€Ä „—DÂ€n}G∏äöêÔYw,0OLg≠„πÍüI@¯?}òdÔ¶öŒAb%ëˇSêÀã.¢¿cÉp
gmS&Ah+åHÅ™W∞mÛû¥ÄµïÕqÅ%Aºc^—êFÌ…“'!˚ﬁòó˘.aâ;ÒPÓ_∂ó∆l/Œˆ9SÛ“ÅyŸ§»mxß ‰‚Âµ¡*?áÁ±∞wÚ¯aß0mß∑Ò˘Ä®}
Éwñ ®;ÿÇÃWƒÈ®d"?ÊË¥Ç≈DÁÕØ‹∏≤rnXú-ò∞úÑ=SäÕù‹ãJLú°â W}>|¥Üï˘ãÉ’§ØΩUŸ≥jÇÕÇW•9#Ωø|“˝√ìﬁ◊Oz>=Gé~Û◊Áó—U,Œç(≠%ˇæôè’Irêhç‡^UââÌŸmöryê%,lO€ua2ÏD(ÒûÑÅ~§)_wníE¥4Ò$xÒß!Èπæ;√ú,òkL ôÜlÂôV-úD·?°eÙpfÔΩ¸FzSÉa£–0Å;+ùJSÀÈ]2~Nπ∏˙càù√dé¶ùe•Æ9∆ßgk¨#‡∞†È¶©Ç◊å”<˝<N1ÉMÉ¡√/ãã«´@ÌGÇÒñ˝ib…ÅMﬁgÛBé◊zp~‘~˚ÍâÂSıg§U2>a‘JXΩ)7NiS⁄v%\b„—ºù1ØÅò{¥–∂7=—@ôu9–>±KBÜÇsÄÈÜt…zƒﬂ7Çè§ˇÔåë™oUMŸë∆∏êˆõFgÃbÿ"Â6∂8i†Ä}ò`∆áxÄØfﬁÀıbÅ,!0MiC˘¸¡Í¡›¬∆©<ı ßJ7¨É‚€jÍ€™b 7“DF√…®˚ÀOzüΩ„¡†,¨Õ›Z\æÜn,.,,ï–¸‹⁄Ç,	åº©Nßã§@z…ÚBJâÙ¶ùC}WXçëÎe&)Y$MO
m`ï|„”ï†vÅÓæï&9«›ÿOê◊4KíÛ)ıÉ™ƒ&ïXP°j¿öE®Z;'ö˚±Q(_2∫}>ºî)íy}ÇÁèwÌŒ2∏aÍµWÏ*+‹ë›>v2v[ÁÂWu∞e7˚Í„ªßË«áßàg‡d¸JX¡¬ß3Ú]ÔRÔª∏\ÊºÁ˛ŒdÉ¸,è´÷öh«™íˇ˙NT»Øè¬ÃcΩø≤WÆhuù˙Ó∞,ñHµ:ÙÄ8m|D≈}	‰OÀ	Æ⁄pˇôcyv!Ï˛ìÊ&s· :ºkƒª°E<—≠¨TU±j≤¸r¡∂:{†˙Tàa4p˘E±C^F>‘ÑC$nF°~eF°Hj¬MÇ∫Öy≥&üŒ˙%©QmÆŸƒØ]Ô0öáh"8rñ˜HÓòRõ„:!áqØë´c©‚—ÿ“ŒÁ˘ß⁄ ª!…ﬂ‹v6⁄S ˇQÕ~YÛ`#Q6A~’µ~Q:5lfdMEn“µàïÇ·≤P€Ÿë5∆ˇÆnGf2vE˙¶W@≈÷U[áh’n◊6,˜ÿj±çtù  æïW·£Wl§∑Œ∑Å˜ö™ñ÷X√j…+ê#¬!¢…£#≥≥2\ípgÜI´	9ë4‘Á\∏"a⁄ª ‡’•pNÅ•¯Åπ¸x≥ì,I-ÀæjL„\PÑ¸§lúçãk[°√¬•$a`=ΩÄå„∏˚ir¯-|wigÎ¿1ljöˆL·±á≤0Yä∏6.≠HØ`ÿ Û˜à‡èZ~íSæ–∆⁄s≤]kµÍqtôOB√mª: Gº∞ÿØäçê«ZÖL„ıÒD¬ º #øÄ≠vB∞—†c†Òí¬(X%GI7˘ÒÃ‰Ù¯Y&É∫%ÖÅ∞¿0$X9ê^è©ûíI6Ì6è	|åµ “KÊ\Àåk =Ö/âç∏Á≤Ø4Ô_Élö˘?ﬁ∏1≠™≤jàﬂée—¿Vˆ;ë4ö’«.Ê˜1∞òŒπ8I~'gÉè¨®w¨ècR1◊/√cí3ÖY”ÍΩ‘*ºu˝ÆÂ°ÔCø!˘PÇBH∑F¢™m»ÙääBaÂ.^≠É√â∆?ÁE§0OLlE5äfÿïøí0u÷Ìé´ÔéÂÿ∑≤À-´}ßn?◊˛∏Uñî|<Kó1∆}ˇ.}hx‹¡`2?É Dàx∫jÆ”DKê“GJ›Øíƒ µòõA7, Æµ+˚¯H}ı« ÿE˜Ón\,Uf*ΩâD( m6*Éó—ÏW+û®èˇsÒòﬂ∫˜‚‰Ω·ßtòôIø8Çéÿ≥≥#úÉøÒ˛“Ô¿ãòlZ»ŸŸ¡oKõÄ/Ê°DÕÏ#†ﬂ≠P9ÖoJM«dÑõ-Ñ€ÕMmWw¶BÌf˙lïæ'ﬂ,ç~Ë{∏'ƒŸ÷ﬁÀåJ¬Ç\√´éÁ~v$ô%SÔ˝qP´vˆ@ÛaœÜ€Ÿßò˜‹±ØY˚Æ[≥öW∞∏ƒÔS]∞Ô÷àåü…ç†∂ÌÓ◊q[ L„gml-«%Å∏Å≤≥ﬂÆ µˆjï¸U÷k…iŸmH7ùbéù6:⁄ÌØ•sŒ Ä7o.π¡¬TdW≥}qeûb±R2˙iU®Ö¸E7¨qÑÿD≥à=û“Pï¥Ò#∑œ'zÂ∆–¬C?Dπ\*óÀùºx€†ë#÷»´≥ó¬¨ƒi„Ê&mÆ‚è©2¯ò*í1U`ÓpìÎ4Ò^‚M∫&¯è‚uqó∆S‹n`äH≤éíÁèÅ
Nn+-î˛„∞ﬁ1˜ `ª«÷°^$√u˜≈ﬂáŸˆq≈§=∏œ†=∑”vÓ∏Y<›ó—»È‚v±ö'ÒF/ÿï¸‘ÙÙài+∑(À«Wj°˜√ñ≠X≠Ÿr(àJ•Å¯…Ù”iIõ_∏ß8ûô ég3Ÿ¯3!\1ºÚˇ0¿ú\¶k«÷j>±`·ei∑-,ÛÚË[•– =ôåoúåúÿ’›†,â–âÊ¯sº≤˝_±.û¬:Eªfª	∞≠[ùÎX ™É;F%’Ü€ÓTÓ¥«Qµ÷v7•}≥”Â}Õ$¸f4√Âû]s≥_gÌs7j ´] ÙKü¬&˛°√ì&ÏÈAD»◊ºÇ¨! ¯M2wõl-◊xL4Ñiuv;tí›–™Ìê>YıB¿$•√øÑ“cA+l2ì˙…D»…7ôaM¬¨^DŸhìPÃ #MfπQ*öÏwî9nîäœhWèŒ#{Í"¥¿÷≥âOe1ORÚ¡œFüµG¯\îÙŸs1§Ôñ.{æ?‚˜…üke Ú7‘¢8=ä2≠‰^+QtïN_Ù’·/º∂‰?f˙ï©Ä•"ˆ0/Í®ê=2∫ƒÏa÷®M|Áë—ùû®0‘¢gÙ±xÈíæEÛ'˙ï£à≈DÑGX£Å*ÕE±œ∆*^ˇÁRÜ±"Ñ¨˘úVDπÁI@q™ÿîAI«x%\Øéi2P…Q◊.N∏wïΩ`FìR¡íJJÃ ÛcZ-√ÏÃÁ≈b9∏œ8∫Âñó∆,Ÿı:z5b”~@î*®WI ¶9tvÆB`Úõ’^®⁄;÷~Ω£'’X*çıÃµ≠¿¬ﬁvìòÈÜ$∏91©.=c¿\kç]∂–ÆÃB„úã_·&‡{Opeÿvùzïwõ?Lî48¡Æ‹Èìªàwáú§íòAoFá"th8'å/&ÌHv≈akg†uFÖJs:§·y·Zj>p≠_¥) ØF’Ä
§ol≤ñZONp≈“ÖA;±∑ËÿªÚflÏ“Û0ÒÀ)∂πàßÔ0TÅÏ2¢5cÇﬂπ‚hÍÓi'≠∂S±Ò˛°µÆ:Ìy`¢≥àHØ⁄Âîxõ∫Q+ Ãÿøºº_&f}ùÊgﬂµKMó»∑|Ìô7µd[wmØ‡Y42Ã®Ü@÷ßk˝˚JºPT_DÜq%@$`2èx"7¸–Ê?ˇ1W•iÆPXÛ†VØ'+xNwÌˇ÷q¶¡≈¯–î	-\úwÖ+≤¿ÉÉ∫∫$ãáÁÑoË7ÆÀ·`gæhd`,DÆ’Åê˛fA”È¿l;&rÖO…b¨ã`1WòXºÙxrﬁÂ)åªŒ6>'Å´å2&RØî|«–ó¢ıÒ4$”∞êíº∆*πÀMÔ|`Xë∞œ9†sÍΩ#¯n -(©(æg˝|›™5å^U˙≤^¿*IÆáøµ/*Ø„M%ÙS≈'8,xd°«|·q$+I»ÓtÍµ™¯ïˇr~ÌBˇ≥}”f38Wa	è‰Ñ¥ﬁ∂ZÓ^∆MIòëÂ7≈™∏
qG\zk6ñÈ{"øh¨ßÿüW†ˇŒÜÀœ¯ÿ+ü0ÌÜ›∂ÍUè6Ωè∞v·tç¢*ö%‰ô)‰Ä¸4Øg’÷lÀu¿ t9E&6TF+R(yD ¬œäÁ‚’Ü3Õmª‚46HZ9¸ﬁóSÓm¬Ì´ü“OÇn…éÀÒFíp3%e0±^Ã≥‹M¸Å’xr
`◊ÔZ∞l¯Ü÷≠6>ı˘SN≠T*˚≠fIÂ∫”—«`êñüﬂ&â5U«◊ê∑6®>·€≤¸9ﬁ‰∏-ÕÑ‹òTï≈PriRbõﬂ<SiZh],”´/ëÌó—6: ë†zèﬁÓ=|‰ïO]ôüøπ∫XZ–dò˙oÎ›{T«≤q3z.fg–Kj‡Ûˆ†Ê!)™æzîO◊œë˚ë∞çPﬁD∂å)ÊIÃ®í¥ó,®Ç¿µrç≈˚«ÓMﬁ‘FŸ«˛“íΩaÂº,gi¥˚∏W≠≠fü Ü$Z≈ÖÌP∑qÜ∫—}¸∏˜ÕÉM≤A7VóÊÊKõﬂÚ˛‘⁄ÀOŒ†k‰îÇ -Î†âÆX’] dZÜXHÃ∑¢˘YË{ºÕ†≤ÇûÕFÀds61>.5• Â9√Vö“o%™]ÿIº+®/É7Û7í9,m¸Ì∑ø˚ ]¿¬ªº\ñC-
o˙≠oãBÅ≠”SÌpvÖÒÈ˘{º9BŸ≤˝·ÉºPıﬁà(·œosßÉ˛∂Üüi{ÊçÒÀœ∆@ÂıπıÔ‰Œòƒ;cƒYirŒÓh„FIõ–§ø9æß€ÄOêíÌœ÷—áÄ3_üﬂ *ŸÏùŒæﬁ˝]»°µπk•Ô‚(bçi’!)OÂÄìΩnΩB¿ÆÿÌ∑H{§9A4L˝ú’wr*ŒŸd0
?ÊÜLPÜ]€Ã˜0(YÜé ºn:Ï´Â5˛I%ı˙—Ü˛YLô˜ˇ?‘{ÙﬁÈÔ¢ôx⁄4•NÍi8gÏæxg33Ü`√àLû_¸»`Êå ◊"Û¯◊ˇ¸øüæÖ∫o˝ÏŸ”«(9ÙôÑ√ˇ¸›ÅIYuDR§∏ÆÊÚœˆ⁄ ∞d‘Zﬁˇ÷7p¶ J†ÇßI∞ãP@´-âÈÒ•A¨9Iﬂòû†Ó-Å◊$%∫H∫vÍá†JQ±
Ù#üﬁùóXp≥R∏ÜN5*gÏ¯vj[îØsÃFÁ¥¡mü'ï√„≈˙YGwPkVGWPyáU„fó7ı–WËÿVù7xûì*_"π>ÖÒLvzoQ∑‚ﬁ¬∂⁄ùΩ‡=h`Œdx!¶Ö˜PÉko1ïü ç„ˆˆÒë.°{Á»õ÷†û8œpKNK«0«”òéáA)∞y≠j0@ÊÈõfÔú‰Œ~eœ≠Yûc3D†£‰¨„¥Î;¡ w€∂›‰6úGöEa"È]ZrSÀÙ$C%:„´Võ„+µf%Y,x”xãÉI$∑Ëß0ì'ˇd≥CaBüxÆ ˆG0ëÍN0âÏ=Á cŒö¡+=åA∂ùmß√m2oc¢”*nrãû-•”xÑxﬂ‰Ü±ß´¯|Ípõö®Iì¬$Nâºﬂs˙®ß0ãßoz|≤è‰ÁápéŒrÙ≥0A9‚üé&0Iâ-ü(;IS<—–±6É' ∆¯«¿ßôﬁ„	Ä◊ ËœïKGO‚DÖ»≥x8è∏~©ÇFHëuÙ“gØâ3J˛1:¯^Õ∏<Æ:¥±ô s:∫ ≥e∑’#§¢|X+∆D5Ù}”Ö:g ~AD´WO ¸ó;ƒZŸoP9h(]ô
˝.Ÿ÷é¶[*Há’+ìì–Ôu´—–N4·ˆ√Íÿ–ıµ=«ÌhzfroX}3©=_qt˝R^=¥πfí
˙J˙Jôà®~∫’.rÉÉ‚$vª;˘ä”‹w—∫„‘;µ≥í9MtùdƒìIßquE&5uE &ä4z¢%Mâì4œ˚6#«ÂT‚xBØ®„8{*q® '»KÚ	 ÙÑTç/~ÙH=R;rPgµa§ÊÌÛ2ÇKuúõ‡Iü∑\;1vÇz?ˇEÔﬁW‡øXΩµ¶¡ÎÊØ√∂Y£∆DzÊõÏ?KÓa%[ı ~ù÷A\m€wkvPÍ"AQ≥“:å\÷*!Lª
ˆ„PÄõ.Œ≈∑&l1NÇ…x*f'Uº§{¡+˙^0›y·n#ìVZ2aWDìlTÖ 
]¸ﬁ¯Îo>ÜP9ú¿Vèœ;2
›ñ÷s∏›˝ÔOªˇÚe˜Oû=}<ÉŒÀ;9Å™~ΩˇÒqÔÎÁn√ñX]+Ω¥X∫5C
P°™«nèômFQj¬+0AbU–≥«Øvﬂ¯îD¨êÄmm	é¢Ü-&ãz,Ôë gho(gØ∂M81∑©–‰î¡ñJ†ÿëô|z”√πlÔA<ñÜ…ÁíÙÁºÙ\ã\QLi∂Z4øB^†èn™Z≥©)¡M√èÌ´Ó˚>GüÁ˚§¡˙çmÿ–É˘5%ÂÂ:‡˙Ço¸xS£≈»æ˚ß◊1Âá")ø5∑bh[c’∑æ_µ]íà54≤À*ÿˆ D6@ ¢%=ôè≤ë&∏Ò	•≥si3:1ƒ¶óQ8°ó^R$·)(”	®¡±ê¡Ù‚¶Àœ7{j∫if }ì’˙ÎïØ¨êp¯2Q5/ñp«ûÂ%3•:»G£ å÷∂/(˛°m·‹¡¢†
˙§ÖöN?zÄz^Ô˝Ù5¬Sà¸^ü[ªVZ7 5wtöΩz˜CŸù[drDÚbKbs'g$C%6ß%ñÒı±π¨·&^≤ändüÎk∫âó	ß$!"nœ–][≤ÆÃb†à[Ÿm®T0
T2ßd"]ÜÜA≠ú¯›Œ~˙ûlóÈˇª∂ã?Øﬁ/BÄ¬ø√Ü¡\˝¬ÆÒ˘≤o≥ã€8qÖ;#›&8ÓÒ˘ç§tb‹˙$æØ{yÏ	êC∏<ÏﬁπÄﬁiDl‹$ÎÓÇÆÄ®Àù6ÓçtzYhî‘AüQΩhõ‹k72b⁄C%ñÙøê§±®Èàm›jÆ˛Œ–„váÓú‰yÇÌa`≥ÑKWC∫_Óó∫∫4V∫˚„√piã”L[ëqt≠ÕëîKÄÖ√e¶ÃIGØë®›*h√·*#L˘fû¿Äœ[:’I⁄Z«™◊*Hb› ’±ΩÒyÛﬁÂ°P{uèäAÚΩX«yÒ	H53^qwzÊ&ÓF£ÓMbËÂ°eásK2Y}ô<ﬁãÛ≠}˝›ê{ÇO—P'¿ÃÔFF‘Ixúê¢qÖ}M€úÍ¯8Nœñ’l¢ÉdÌëb@6D®f«Ì>»∆àpÙ‘bF"Ò’¢ÇÀ´øssû!\'c	≥ê„ò≤ÍÒ°∆w≠˙>ı.˘@’¶Ô=õpå~O&V≈Ç°U1&¥ò.p…∑
JÚ(M√Ã/ñm´]Ÿ”hÊ\·&^7oTçÙÔ~Ôæ‘g‘Äö”#-ßµd9˚ùÿ˜=6ŒËOõ°∫Ã˘c
πV5”c8-∆h„zÕ∏ŸÅ˛ap{ø‹~Üú1còúÓetˇ·&nÎ∑[8]&ïËí≈qTÙˇÉ∑ (bFøB“äfPvh'TªÎgÍ¯“xÈTkè}ŒÂ†ÜÕi†	É´O>Ûœ«rsºÊHaÇNCjiÓ@®`íñÀ1–å§9yB–ÅôVéÔû%˚¸ƒÏÅöª‰TÓÿ¯!8~?¥“$ÒÏ)√á,¿aƒ]¡ß*€j&™Ùë†ËRÜJ◊Ä:æÄwJ|2‚å!”B—µ'bFΩ•7’ø‡ 'Ô‘’±∞‘pvPŸ&%kÖﬂS{V‡L!›ÌÇ‡Éµ6ÓëÑ”Í∫o˚$øqùûÃVîT◊#8ù≥¨‘!|¯¬¨ÏsˆXäj8òPZ≥õˇÜ´Ycx∫ -ªrTÅcÓÉ·P†Yn⁄¨,∂ tÎê‡Ÿ„´]&œ)Î†Õ^≠;±Ã”*ÇÚí/H¶r—ÙÍ◊…F≤√Ü£∏˙c„‹;ø◊>çCpQ•
o º˘ìÁeC0÷µË•±e9Õ§©â.çÌ(ÀŸéà‰5oUfBÇ&s≈AÏ[p©ÎÌ¶˚Æ∑À_ÃÖ£9‘ÂbÍHdÜ:¢Õ7ÖSy›∞1à~3ã–SÂÉ˚æÛ>X(…»ÿ]Ö‚ÜX∂ı—bÜ.Ω+úåòÃM
Ë>!)q:æ ôx1„ƒGÛ÷/Å:∂wæÚ}_ù€èL≠g,P‚íî—¿{∆:˘≠ıe?ÅÀËïbÃ#Ú$	≈±«¸oçm\n&1é’% »_DXñ°Y◊ó“Ç0—åπÏ–á·ÇÒ8I˛ÛâI7HW8ÇÙÌwî9≤3fh>H±&[πL¨ïÜ—x}w†||Í:÷Õú≈¯å»çx>∑ku,Ö84BC !ˆã=mæ‰}+g∑˚ƒƒê@(5”
BêSï9yÙ!1¯9Lu¸M∏∫r´¥∂uee•º> A`4IêåiˇViÓG•eØiñZUJ”k•≈Â´+kÛ%ØuöAUJ„ÂÎã••ÖQﬁË>§	ô[Z
lë™%}4ÀŸ¯G–ƒZ],·)06Ôﬁÿ©aV=+ç∫ﬁ´jªïv≠˚lÎéÉ•∏ÚWªi÷∑±ì*f~/^%¶]ÊãíDE3∏≠L'_µá»êN#A*CÍ9‚ä”5k ﬂ˚”+åŸ|Ä—r•ı¿8.Æ–t⁄ç,‡9_∆[u<9U÷?)2ÎN¢T®:G[R4y∫èË∏ÜÎàÃxäãÅ†LÃ4ÃÌV»_]∆c°È‹ª„€Û—`<[k4á[<˚ú≠EöyM[@Ro/@5Å¿sÜi2xsI äßœ‘§á‚ﬂ‚ôö¿=pÉ$+˘l»Cq‡9 é¡€ê3¸lÄ≥Qás·ùÄ˚k_õ`$b¨òüjè%[;å˜ê…úY,E∫íC<<èû(Ga6<èé(£ê¿/<èŒ‰Äœ£'»¬ÛËKÜ™<˙Q·(<èæî–	œ£3)V¬sôA):¬Pz26Qƒ¡±E¶Z.√&ùûAÂ∫mﬂAÄ2ÑÊùvì”@—‹Œ¯
é–™AP7kZÅN®÷p…,àiH/-®)ò»âÇôf∂å¬¶ÄRÈ£÷Fp-C9ÊAX8Qv*U• r•ËK#+ª±âÃ Shî@„^»öàk4ò£rzH≠zΩˇªˇ˝Ù≠·¥Î(“ÓWgnÙú0Ø ;ÇIRﬂ‚Ω±ÚÏ∑7∏›z√4vˆs∞6´xG6(ıc⁄çVÁ»sÁw≠≠R”Å∫‰~£óåy¡æ‹1*y≤™6µ≤=˘íoÅs/î ?Z_YEkã◊ÆØ£Ú‚BÈ ‹⁄z©¥∂æ8?∑Ñ Û+k•++sk(Qﬂù!«‰ïÂ•ó£ÆÒ„sªxÍ¡ÖNX4˛|=\K≠π+≈2s\VŸÎÕ{¿›k◊öw<¿u)í Iä°É´1'aé0!ŸˇŒ29%≈¢ÛGI›ò·LÈç≤ÈL5S›Ùπ9µèãíbÉ∫
ÖqÔ1€‰kyJ;175Ì∆*Wú∂ ‘§}ƒ#R≠E+sU€ƒ∑ê 8”⁄z
˘”o,.¡«çI∫q–ÆÅO1	!´3ò:µäUO÷€õ¢{⁄Ìå\⁄(-ónºº©Û6F+M¢=¸è¯Æ§Ùv>ìÕd7e/>I!Õ	›Ü¥÷óÄü°î·*‚eÍ($4‡¶¨f™$·ä|Å?Öõ iT1a(µª$"¿å˙òﬁ‰±Î¨íd"kì√k≥ëíÒ¢∏±”‹(ÜÃíπûœÆ·pàÙ˚Ü›®ﬂ9g$Q÷«â4¿ô∂º|:éTÈw}íÎôπ˜r}ÒóóWnj∏ãbº“Ø%_Ü!åx…ù˝Ò“Ö¥>7Oˆ“ 5î∏ô£Â
X!—J≥~Ù¸•uˆ∞>ÑYΩ`∂ˆ;2¬!ogªwâAÏ∂’FKŒÆë0W-¬c¡ˇÕ#ŸÄ0◊»e!AJ±·Ê"Ä`\PM¡›)R‰†Ê{¢ßâr
Ú]∑€çZ”™sŒ-E`#≠ÒV~Ø|ﬂ(Álîsmºêﬁ…Lf≠M@wˇ‘c9Ú%q®Ld“AârF#‚r@xZÄ˙¢`ä—˘-BÙ–{»2m¸3ç≈M∫ï∂SØı¯¡Ptë#ël?ºëF°Í¸cVâ˝)&W7’∞ZâD›Ÿ%Æ<˝¡∆<<Éú|p£¶s´"4ì$aƒá#*Ç0çêâ˙-¡°Á‡ÕÀAÜ’m¬Fµ¯-®F›bZu4ˇµnîfs∏≥BÔiaÈ=ﬂ[!-0Çƒ>ªrè\Ã$BÅ'bgAﬁòﬂüWQØ`‰"	¸4”.<˝n 3O˘›Òÿ›⁄bs«»@`Ã9€Ãà0¶éÈY]wLs£F8N'YÍDx†Z«⁄∂; ü=›7Á¡ONâ@¨Ç¨—±.¬˙_JÂSŸ∏ò ã$l±“ äH.sü3uveG˛≥áˇ˚¯Ù'Pr)‘˝…‘˝≈Wß˜?GΩØıﬁˇ=Jx0ì?ˇeÔ√'Ω˜ﬂF›œ>Í˝È1Í˝œ'ß˜ø8}„)Í}¸∏˜Ë=^G"Ìè¢V≈¢å&˜¨fK/‚¶≤€¡ÓPªë=*üÿ1«mÃ@r>$‹{I˙⁄ö/—òÈw±Â∑eœXà'æ…®†ÉuWØíN‚ÖåùùŒm˛8	oYm¸=|€D€~-°$ê») ˇÚNÑÊìû‰ﬂMVÍµV≤eU	d&Ø%z<]êc¬R|î@5ΩÏóPgj9„|†L“o.ÔõUÜ)oaxóÆˇWgä©—ìG&πÑWïÎµ∫ÅD£@Î÷.JºƒVƒi‚_∂°““<ıt–k†–tq]«§1±`c—4~L‹f4‚'¶bq-dY·¥l\ÅrèÅƒïPãØù@lV‘}¡√Ê¶ÖQ6-0(LoadOÂ¡JÜ˘ÚäîLÊ÷$Tj⁄‡!?Üè≠Dè–ú‹¢≠¥˜õ8$5¨√‰ƒE≥â`ü3‰\¡cQ\:∂wvlí`ÓÊÀXÄπ@Ë–©J ˛⁄d_è‚!…Q@ÂoÊG^å\˙_ˇ¶|Ï“˙*:NTP¥]]w:V}’9¿è˚Ã§”È±T«Yr ¶‹ÅÇ∞â1È é›¶K‹∞í;x€P|[¸%ÄÀŒåa0ÿã®ı=j#ó†º/å—Ïm@î®¸ºΩﬂÈ8Õ–C†∑Õé–ü¬Zí”úØ◊*wfèiükw›VaÏN’™Ø¥ÏfRP#⁄
ØZ‘¡´xH∂•Xbú€•ãO°‰ÉÔ
bÇHD•P)œ:Pó¢I¢3$M*	`ü"4=CÛe;3»r√3£	•}ˆ¯m(o¯Œ√”˜P˜O∞0ˆÙ1Å±,€Õ*"3rΩEñí¨Ôﬂ~˚À/KM≥Q4˝ì˛XW“≠4A◊\‡∞ë¬ê	&a@> »uâ¸¿´@í–ö›¿ HMµ‹0f‚!TVQùÔóÅ+ÿ∂»¨É*S≈4œ—á≈µ˝zÕ<œ≠™t=o˜~˛6ËÅÁè©jÛœ·ùús¯nFzG»U:/û0*Ëˇ5?z∑˜˛ó¯%nXùΩE	|∆/†$JL„{jjßV«sü® 7™¯xsc^ÚPBZXmhv∏)¿á)oöÄZgûK±”:Ñwö>|ÿÀûßÚπàï—∆!U»U€kÊûôêW‹ô¬hÈ¨ŒÂÈÌ¢©	ˆPkw˚ï=¨7ìáHƒWnx,Œ;π—∞‹;…dÄœ‘±tµ⁄Å⁄ﬁq∂àv»ÎÏ„ÑZ∂2E¨ ”?A∆C≤ìÂÛÿ¶`â>·Pª=%”ÌXÌºáîÔ–W~≥†uÛÃPüÕo>b1É@ûqäF(	Å˜∞˘x–»YTD	–†◊Vô&¢(v¢¢Fö1‹tË£"*^gˆ#Ü>¸&ÚkH≈Äsi›ÜëëØˇ`‹õƒ*‚4W)?^pöb#∞–wç≠“¥r≥5{,}˙fKÛ‘ím›µypÍ}<á);M2¡•vM=<è^œ◊e»^WÊ∞°∑gRÈ)ââù|ü√ﬂg∆"ÌH∆ØNú¢Äht2|YÀ™Ï˜¥"/+§x±Äe*&3:]˙0:„	À í}_0ô2ûu´≈cÓß¶•Cè5gè¿ÒØx˜`”;¶ƒ≥aqä!-≤œS‰®Xﬂı?ìﬂ-∑b`£01πV™â-»wß˘bK4&°‡·¨ﬁµz=Y!Ë3d±vúvcú¬¶‘ŒM'†ßºíîôÄ#ú@‚¬iV}Áı–aí™|jÏÂ# LË¢◊PVt»«#îü¿<†Õ®CQ„B‰ŒÄA%.Q˜Ò28Ä¥_rvr|zz<õÉH¢©±M´™uaq*∑ØïÊWn‹(-/î§÷`ùÒ^"UÃh'%p#ôe¡!æq0Ô«_@Ïn2≥9rIa™ñç
üËËC@¬Î◊F˛v	$ıP™R(wç2{üæ9v"æ6 øBÕu)n"–\ñ˛'∞îI≠ˇíŸâit`1Ä_º(MÁ∏9Q‹Ô≠¬Ï¿ì-„NÃ>ó®‹Û@]r˛&Ùaº<]œ!0ÕP⁄%≠çIß¶_à*¯	÷·`üp ÷k\≤‚Pö"‰£fB¨ı™qﬁI=DÙS`ËœO£†\13É0ßZùõ_{ˇ‚râÜz‚ﬂ¶ìk+7ó–Ri›Xú_[I.¨¨£Ú˙‹˙Õ2∫2∑Ü›œ^Ô}¯§˚ãØP˜Òª›è°nŸ;hı˛ÚÓÈO_Ì˛‰@Ÿ≥_zÔÒŒ§Bm‘·fD“h›¬ô¨Ïû“®
¯–Å•àØuGˆç™$3∑EÉ°p–H4%&˛Œ‹w2ÒŸñòÊÏ6‰IsèÄT8ô‡Iô
œÆËÕ
±_}{ù§ºÊp£Íîfó–B1'Ÿ:pe†·}]†üàÈ”F≠◊ /ÏﬁQ‰≤°jï∂ì\p:Ó†´^Õÿ§ÒÖÌí_ˆ@ÁíñzTZX…F8zƒìaÖ4ÆCF<=L¶#D ≠‹Å5∫L:;ûÕg∞L»Àdá"%ˆÊ◊Ü˜˙Úê•ƒ6¢˘∞«Qw≠˜˜‚•ò‹6%∂2¿@l º˝÷–˙Õµe¥vÕ®íDpóÿ∫§K?∞öá^g˝ë–puá·Ω-BL
À∂A˘•k(~Äl1Çy1zÏâ—8îV%“îaVÕ∏íËÕë(+∞Ó‰ç X_iV]tqEœÿàO€+Lz$'“[Ë"?Ω`fEπÓ3#∆5E]ìaGH∏ïàJ´qT›Ó˛‰ÛﬁáØ¢”{OPÔÕáœﬂ€xxäNzO^'∆sBãÙ.7dè®K!Èkò…^Í=Úo
y!Û¶ﬁ›E÷˚Ì&h?§ﬂCÅ»+Œ·ÏH§≥y mÖ‡îü≥Ò”EHYÂH˝[{vdÀ Èo;µz}vD]í√Ì¥ù;¯µ^»ÂÚôÇ¢z”≠Zµ≥7;íïw%œ-¯næmÑÃ»~Ö›˘¬N>∑S ’4dº|‰ÖbÆX‹…Û˛;Öi;Ω="7öòÃôw◊ÇÖ∑vªmÕÁ'Sô¨ÆE∏◊ŸŸ¡Yv3˙!JdP2 É&»W7¨CˆÖ"¯è6äK≈j·ÃQ±*|®áºÙ:DIdœ$ıÃR
V∞ÓÓÑæEULÊÕ+à·≥„rÊã)…(ÚkQíÊxbÛD ÜÑcE^CÊ$óIvÖœaÂ}æ`[ù=Çª[©„3ø$	üDÈ˝‰ˆ‡nY®I?*:ı∫J5Ù†‹Îd$e;∆máR∏A }ØºTZõ_Zôˇîñﬂ4òSYÀª«Û)W∑Â=Á¿%l
,ì}>aìA∑7@e0/¸ V⁄ïdäpGçs"Te\nHﬂÍäDäG§#ûlæΩBqÓ]|ÿqAºö¯¢O&¶â≤Ü%ØÑ‹i‘âµTµÆ†N9gÕ‰ÎÀ)¨ˇ¡'çwêòîOã<h’§i—µÌKaﬁD»{V¸n∞è’ÉQ¯{boPqLP∂‘A˜˛‹	á£∞);/=ÙÄ)õ$e2⁄‡wV¡ÕWMïÕÛ™¶qÎÅÍIÉ`T!Û
Ò$’+$…‡—4ò–i≈~Ö≈a√‹‚Õfú±E∑ﬂ£Á”»1Ub"±ê6êƒe«ö®LI™¥cy\ãøäJ{Êº”ÓXM¨çWÊ§˘9x√ï!ê‘¡¨·ÙÉwª_‡ì…ûæ˜†˚ÊÁÚﬁ{„ì”◊æÏ~¸	˛
ÇÖN?xØ˜·S¡Hâ7…~«πBfM¬éZ&! æBí¥j¯ûKG0"û&8cdÅ¿itíEHùÎ-u"å(Ç,!¥¬hZ€…LV/=Ê»¬7’¡õ—–M°l÷ØÔW≠∂}~9Ñˆ$˜‚µ&(àIEÓü¥P_H˛¡ÈŸÓÃ±JC¢ü?¬9CöIƒ∫(± é/ƒ÷√q†¢èZúJ]¨ß`6Ô=∫◊{˝∫~sıﬁáòœâﬁ£wº–œugwS$G˜¯>¡]⁄ûú(µi\[e£«Æ∞¸£^B˙ÇX…˚ı◊H˘ö‰˝–&yCzÎ¸ ““‹jπÑˇX[ü[ûcoäÔâÜyÃh:˝≥¥”ÓüÓıÓ}ÿ{¸îPÒÇ`0Ê«‡'√`Â˘5<N¥∞rkûàÿ∆¢lŒãñÂø‘«Éâ3.’35qäòÅ=ŒKÒ1>|ÃÄ˜Ã(p¨Q”‡mOÍòô¨>ÓƒÁ§Ã8BâµaçCûQk	€o]7≠‡O∞«aqM“´ıN#π”9E!0˚ÊUÆ\Z™“e±“Õ4é‰HIÛâUíÄéUÉ¬dÛR˚î‰+‚ŸwÍ¯a5–µv≠Í◊Å1√Çàî'îπ◊!+ÃI+ELçC±à‚xzÏB!˝‚8˘2=N˛áÁæ?9ùÆ⁄ª„—˘KÁ«Ñÿ'^Ø≈∑å—î0öÿïNø
xºáMÍªˆ≤ÛΩ˘¥.Ÿ;ùôÄõ`NÚR	]_YZπ∂6wÕΩ4∑>∑÷‚FDíÊ¸Xøúhö˚$£N¸ÇXô»ë∏^vw´MHîÖWÖB[Õ–88€l`á3˝V:›CyΩ∞WÑ
‰êì£xÀ≥Ê]8˙óq˜Ä9∞ü‘‡|„Ug7s‹î⁄ègPÆ®ÕWq≈©qº˘[∂Öih±I—˝∫:Ã˛¶kV∑G=≠S(BöËº»«»GBE∑ "TÉŒ]r¿…ÉÚKœgˆ2˛	-ò≤zdˆriÒÜ/ÒPµ‹=ªÍÕeZa;÷Ã%;	ŸhÓÆ’±⁄h≥¶·RÆÚ?ÚtkôÃrfSá*∞Ìñ…V≈èÁ	ËÁHÊ√G‘ªRêﬁ0Èﬂ†naS=H(õ*hh˛≥ÿå´m%®0òÔÓÒëQ^Æ≤'ÿí'Ÿi£ù6>Nr9nwko¬7yl2mÄb§“TTß…õŒYUÕ°†ØË≤1›¿¿dòioÄ¿tºóúZÔ/¡ ©!~+z!¥Æ(Ùaı…${»Vt≤!%/4”TG’a∞◊ &n∑y:ÛF~ú≠¸&&)ç≤,%À*^Á#~ãtáD„"O⁄íÀ±.‚C1‹38ßpn®ÜŒüuÜ≥√öaéóÊ'Õ6∏∏óóÁ22 'û•ñêëKLeMÕ-^úÿÀ+˚j)p∆ƒL@ﬁäÓˆM.#éS˘ÂÚUï/N¥˙úô„ç^§ZÊ{uõiÂ∑ó—Í⁄ ïπ+ãKãÎ/˜°ÜCû\≠I2ﬁi
ºx$SC7‘ƒ…Ä¬„dD$F~ßÀolK‚“∏Öçƒ¶°mB#zòñ0õ
pÍ&FvÙﬂ⁄€Øn‘ö[¯ì=:é<√íJG.}q1âì£‘3iE™Éè2rÈèsµÌl≥™C'/j·<ı¸Cb[ºèÇä≤Á4%§öç"ùµí$˚ÄçΩ÷l*ëÜ™)g÷:Äòã4ZHø(5Jy«˝Ÿ#∑œGf∂°Ó∂'’’DU≠†S’&√B¡PS=~Y∑ô	ò>aOÔ4âøw
©™’h·qGSVÖüß°	güípvûtÃCL¨Ñ⁄]ªQ#1JUMfΩ˘a`π}ˆ¯U¸·ìÓû†Ó„∑?è{ﬂ<@›_<Ó}¯‰Ùﬁ„ÓßFΩ7?°¡gËŸ◊ØˆΩázüºì"QÅì®≤g¶E]\‡ˇØúp˚Cuh«M)¢{í«Hº¨QMc˝˙Zin-î÷KÛÎ+˝òy˘ÇŸƒwRæh§áÔaVÀµW5N™ƒUT„É[1ï:!?≠ÊD	ùΩ6÷˛‚Çf”6Ë†•ë¬jê8ÕhŒÇÔ/Œ*˝≈Y!·)V Í1uE©{ÿTT>IC9nm¡a:S- Ó—¡›i±Ú¥€N?å>ˆá;¬†ì∞«Éø
	Eñä≠$¯W„I.•_>ôA”\xñΩ:´⁄Gà‰î≥É§O.ÔlˇWª“çGÖÑÊn≥Ú∞‘$	Y?·îˇ“·»IF€ÊÆ⁄FNnºÕå6≤∆NnG}ú·6FÀX§UAå≠ì–<,∫∂G‹à˘9GZ∆Ù≈Ävû]T˙≠Ç‰.Ñ¿“Bå¬≠~]=çxûblƒn'éïôqïcò˘ 5ßb$dàø‰⁄QÔ·Ω”Ô  i˙ÏU‘Ωˇ*8–AÁIQ≠ÁñE∞∫IR.•1~Rüb‘”&’S¥öSyñVÆï±jµ∏º^ZcŒ.|¬æ±∫éVWVoÆñ˚—Å62©‹¶ØÂÙ œŒyv∆ËL¯≠úë%pŸ}ƒ|VÅÍŒÓs8sl$p≤é\*Øœ-œóf–±UµZ∞åÂú»w1ßun¬"Ã„EPBÿy#1>ÚÚé|I‹¶Uût∞‰^r#OÒ¨C¯P$ƒ©¬‰&‡§f¯€«ﬁÙ¯lê(≠—ÇÖ{∆≠◊*6¿SÂ∆|¯Ì ÜWDîÇ(Ÿp~¥6ów»ÛèÄMRëåﬂ;â–ahi?4?ÿf·h¸¢"?û∞∏£8è$v<riDK: V∑1+ΩC“¬.Z≥A#qÖéT≤^_˛IŒæ$íOæÖ©`‰“≤C√’@´qh¶?ﬁ»œ7\<&uª¸›>ÊåÖπ⁄v-¨£xH¡JÔã>äÎÀ#s÷≤∂ûùëE… ©HpS¶ÙpÔä‡)÷JÙ
Ω¥Ef£–˙˙Ö†•pΩ%ŒŸ?:8“ryfáûÜ≈›+… *É>¢6‘VØ˛9—JÅa´®ç"^IÔ!;=∞ÑÖ+D»©øg[ÊäºBõıç*ÉóÀ! V√GŒ¢Å!Éë‚≈F/"l†’¯*zR¥7
z‚Ö—ÿ>j eöÅﬁ∂ÍÄ›Qï°¿Ö/iê ")Ç5Õ“Cîÿ˝·}¶ •%ã≠C!G†æ+ZÊ#í)H(sÍÑì„bﬁXOp√|÷≠mª7{2\ÿË•´P`p`çèPä19”nø∆e‡.ÂA˘¿±<#AlJ&›˝F√jëuÎH$©,ã©®ﬂƒo¢¯81á·qñ	å›·#ûˆü
¶‰ø¯∑
Ö∑´ïÓÂCêà≤B1‹,ƒ	yÈÅ#MÑ∞\§Ø´Ü9ÂºcDë≠J¨U®0üûzë"Òˇ§U≈i”vØ¯uº∫∆≤¿}aVA˘–QYÖ[Õ.#Nµ÷~ªUgñL«´:#ë∂1CÒ+%…† ¥p|ë¯°âÖ@Oì´gíx∆@∑ãlz…¸#‘ˇ7¬;¸§ÛRæ∂ó5¬Ú"DBíîN krØ9„Ù’®*à8ísœe4ÖÉ¯ß≠⁄®ò‡≠{êﬁÜÈÎà(hí{TGÕc˘à;â—ªµ
÷9éxÛÓ>:D|k’ﬁ	9í | •–‚Ã+'ˆ≤2Å§ìÉ2◊mˆÑ/π„≠ÈF:ï≥õ|DŒº”ÿ∂:[e€u¡Ó©¡Rﬂh‰`ΩG˜N_ˇùﬁˇº˚¯1*ÙûºézΩ›}Î‘}Û_O?zÄzÔΩNJ÷|ıS0jJ—√säeù—>4x3^ñÛ†6y†ñÖﬁ%ïjÈË]ë*J4é‰˘gÖÜÕ‰7øNâOSÚ Óêª^YCo´KﬁNaÅ”ŸM¢6o•x ÅÀ∞˚Hx)RsØ8ÆÀ^ÿoÓ⁄Nìˇj›ŸoCÖëfá~´UT/C∞àÑ– ÷ù˛∑{åê{ˇLÔ>|Çi—‘Sˆ]˜≠˚Ω˜Ó={¸N˜Õ◊ªo~íJ•ÙŒ¢ôæzƒˇtøπ«˙∆_üæ˜E–è⁄õ4ÛmM$”b"wHXz≠â‰ØÊöÃ
iä&˛ò’ùÌÌ£òVïuÖ»>qZÂ,ÔΩ˜∫o›Î=zıﬁ¯¶˚/_í¯ïﬁ˚èÒ'èÕuˆ¥˜ßá^}ÆX¶«£°Bj ú ˆÏ:Ê≈ª%R?V~)w¿VIø3EOï’’Ì¬≠úOÖe·X1XçÂŒ§
§åQL5\2k∏ÙZïÖ˘/Ø•i«#b‰9hJâ:Ï´HD ≈®fJt∆¸?`˙bÂﬁı]ÔØ ÌEZqÀ≥$âñä∑“úﬂÀ-´}ßnªûØ*´ﬁ·ãHi√Ωi=\qî∂%QœNP‚B6˝"*/ó«bÎ{†Òñª:ÔÎˇÎ∂ü◊†	qÏs/Ò≈¢ú‡†9îÕ$Ü∆™≠Œ˝ÔURNë€x`[,å
û0ÑøﬂÜ(Ü€…%4Ám§≠mßπÔÚ€)’∂I8ebÙòﬁzÇeu∆XO∑jMJπ¥Ë€X{9øÏÄ[“0]Ó7ﬂ]»∂ÜÅu±`U%nK‹◊\¶,T«Ø.I-í$Qn† ®ã≤rÌ`o@–√!°}´-F¡l“.ÛûÒ¡«lcûÕ®cÔ.D∞vıU_Gçèﬁ‘/Õ9¨ìƒÊÀÖ◊œm±@I˝-UXQˇK$ﬂ§†∆3†5€›ØwPôZŒ—™’¥Î(ÅŸ≈8pÒ~ÖÚè„à‘í±Gÿ™m’;mªbcˇHãﬁ’Ìª6†–Ì∑¢sx(¥G⁄!È'Ú
mÚ€¨¬(5äøï⁄†FÒ)Ã%‡&ƒ‰ù4∑Èñ¨v ¥Ì<X˙IÇﬁoπ@^rﬁqˆ8¸ãVâ|çœùëÜ~à¶
ËJ»_(Gäe≤iôœàÎ`çÕ≥0ÔÀËx¸_ƒ!a‚íáŒ†v(l]o∂»2œãü%`+ı:‘ì#øzÿ}≥«≤o£œbñZe›–âÇg¢∑€iñ€Zí°≥›ÄIJGπÂñmWÁ:P¨Ò
®PÅ˚ãyŸS71_kWù]ˆ»æˇü“èÊÎV≠!£∞ö{ÕŸÆ◊öÏ©]Úaû÷†óﬁ~√jZe¢F≤G˛öNòÔ¬™Éâ”aOÓYÓzª∂ªk„ÆƒdM,∂ù&ÊÇUJº/§Û·Uˇ£xÃ<;]Pı6ÊÇmg€Èêµ>~ÿ}Úˇ¿6ñBu?¸3Çææèz?˘≤˚ËõgO^%[~≠vó‡›`+ ≠Ö∆FB±¬£≥»∑ÍßñÄ‹√ë=@™Í‘Oﬁ∞`i€’uäìÂ}$Ωëﬁºú"¯Ydb‰Zﬂ<Èæ˘9Ê∆Âµ1Ú™?≤™Vì}ñk+ÔYm{›Å…ÿáÑﬁ»Â¿Ù&ª—ßöºL-¥ElÏéU√[ùâáPs´é€aM“ﬂIÒ[yãR!t√ÍTˆ–\”™π5◊G∏ã
è> Jc çäÒu0≤"úëWT úzæ≥2g†¬∆Á®˙âMë±¥∂•<e¥)_oJ,ÕéÍí5ÿÚ÷@c=î‡kºQúG∆§Ñí4<>#CÈœ©&r≤JπH•Ö©˛ Ë≠πhÖ\∏äB,Ωê#´∞¶q…%J8Z∏(™lãÇ{ŒFµz®lú%yŒ™Èü©÷vv§6¨µÌ&XﬂI÷ò î^µQ’  Ÿòáp;R^ü[*›ò[/çË ù_öEÖ‡¡´Ks∑ñJÂÚ÷Kãêw¯≤—Ûπ‡˘sˇiemk~ey}meI˘∞w˜rÈÊ⁄‹“†9Ø-.®{2ñPú¶%ŒÂJ|,O—y˜9êúaÑ™'h<\|ûüµòÊ›™§‰¸÷ó6£çgó&ìÎSk£ÁX¥∫^F	ZºòïÑDü@~q„Ãxt€`ΩXÿc¯É2ÈÙÿ…ãcË•≤–->óÈªƒ∫ˆ∫Î€≠cxéÂ–ÀX\J^àúy≤ãO*:JrâèRéfΩkÏ≥“|˜·-µ6W^ö)œ«‚+›  £íOn$´DjƒıÇ‚_^π©œ â≥
~Î´6¯nÈ≈|ØízΩhR«∑∂bLµ E'=x% •|	çÇF<(‚iäë2;∫Pà++sk[+7óIÍS¨$PÚ¸Ñ¬Ñ•îêmì÷4c≠©és‚5¿eüìıyk∏ﬂπ´fÉ∆p´’snÁ®n¬_ß„7†
í£ﬂQ—oÉçôpóA«;Ä≠U¸2\”Éû{ÀGòñwèÇìÔ__}ıÓ=Ì>˙ı~˙ZÔﬁW4™‚£Oªﬂ‹ÉT›{ØC`EÔ7Ôˆﬁ˚KÁ„¿å∆Á€·xsDËßÔŒô˙[:U?ásµäïu£t±∂®π{À•ƒ∞µg[’ê?©O&•|≈Y<\Ø¡€r,Y8{ìD)˚«bˆïZ 4∑<∑Ùry±¸º∏Æ,‚O7*_å—˚Ô;ˆdÖ‡É/˛ìIòï+ÂÓW*∂Îíp,o«ÑÔk·º∫µVΩf∑ï>`?Î ncãµÕQ¡8:Fø•ôòû|ó√gReø—f ≠£—ÍÿQ |ÂXwàmê'XM°gõNgl˝¸”1'qÛÃ—X°á?QrG.˝›z… ?6l*ª0êÛ«±‰tç*∂v€™WÅùåÍVÃ¿sBc±»èFOd≈ê¯Îÿ£x}˛RLLÉ6∑?”	7§¢*…÷–hFD·ö›¬õ:ãÈMΩ˝ÀîÙ¡ê_g{:t¯ˇÄŒqÌ¯∆(àË÷˜ŒvçÁ°ùE´^Ÿáue∂w˙{¬Ôkúx“)˚Ô˜k-p˙(w≥VÔZÕÒFÑzOÌXƒB?Á›°o®0V≥Ë* e¨,oÕ-º4∑º>w≠¥µ8ø≤\ﬁ˚âôˇäSw⁄F⁄ÿ¸ “ öyku∆’π∑$ñ`Ô£..3±l¡˝÷VpøˇuW≠π˝ˆ(<bÃtΩßõˆ>÷XÍﬂ7~{Ã…F|—P-»-K(,ûMQü@8?∞JÙø˛À7âT(«òk¯Äq6˛⁄6Á¨Ñ=‚˚/s\…ú'
¿]Ì⁄ùí˜xŸÓOu¢mƒÍ» H;)◊&^Î±Ô,·˚o3“ë˝…ôÖÔ¥È–€ $˙›e8œwﬁiH∫Ó¨HØ„“ﬂ›\\ΩQZ^ﬂ*ó÷ôÏ(wì‡ åûÄìÇ˚˙%ÿ‰ﬂD¡<iU∆–ˆ5A$õÊ‰Øø˘¯;¬ô˙1π»≠+˚Ì?˝#Z#q^hﬁÆ€€ÙúYXŒ û`çùæ˚ÁÓØvÖû=~ÔÙÉweñïs¥Ç%À	˛‘S"»îÿE∆ô∂~å˙T|å˙@—È!xë~ºﬂƒ[$ı%Öô¢¡ß†Kw'Â}¢6vìÛæÜÇﬂ%î ∞©<ÅÁ¢eA‡¥≤pN0Z)‚´ÅÃV≠vßV©€h{øçeíM≥‰Ùx#ïJÕAÅÏƒ‘ÿ&≈ŸG5çPe∫xj„Õ¢X1ß¿äô+¶Âä…`´
∑”Á~H›*´ã`œL)åaø&IÈ‰vªï<\;π≠Vrd òÜI“¯ëAÍ8Ωd0i“yﬂäÉµ ´
≥U(êv…◊n≠…≠œkßó≤ÙN*À•m@P%DW¶SÈÇP<•è“)Ç@f"K1‡eA^øæµ"È.Ö^ ì£h·¢Xµ&"…@tÊÂAZp≈K.‡Â¥hn≈Ù¶j¶Ã!g<Û26FJ¢@ı—=¯óÆ|Õ6À∞aùÆD—AXìúñó.d?∂^Ã≤.˝Ì∑ø˚`–4PwI•ß’ F©ÉZgQ1qf úBÑ«(ÄE	\tX— iù>"C.3$8õGE¶:≠Kô…•§>≤|π Ö†(F+e·≤ÖÃxf:3û+í:QõÊttA\9YπŒ	“®'3æKx
†-óÀÉ”õG1≠8BË™ >iO± ìÉ-úÃ«¬≠^éTóπè6“©¨›ËcΩ»	•Èn—Uãÿ¶∑?ò9V£±Z{ÿ1ÈæT⁄√–>ÌOùç’Xôc>ÏêåπÂã3&ÖÃ’9I
ùßRmÿ¯*∑eêD*X∆Aœ*}ÒÒ[]B∞GÌﬂéKƒÄŸÚ?G1bÃàx(>BÚrŸhó7Q @ãcÒƒG^o_8/ÚÕ€¯ÖÑ/T⁄◊â·ûä„∞fÎ c Õ5îˆúà'ÑMÔÕá§ñ¸œ¡1π˜ŸΩ”_ˇ#≠PBOÃœ∆‰ú,·d|ò‰Öü[òY6êó[4Ô4ZuªYW,’ñºˇ£ÏyJ,7G|zçˇIˆ¨wyŸQƒ`3{˝N !åtRj’\ßjª,]L¯N⁄Áûs@6W°|ıä„‘m´ôêΩxàX∫I¬ømJ>k‰a∞óêsonHûT˜ö¢3ªXﬁ\|ß¶–m˙∫,ÔsÒ;ı£[ˆv«¡j´¢ûªpÕÃ˘ëÑ˝æ‘åÄ”\∂Ó÷v± `Or©3/’ÏÉÀ©ƒË˝Eñ…·◊Ú-ΩÊ†\z∆€‘/—TvT˙Ò*∫fÌ„˜õ”(ÎJñ¡Ö>Ø¢©u`û∞ZIP»¸|¨Ã¢î"@Sb¶à"R©QïF*.⁄]Ç—Î¢óŒ§DH@ÚQ`Óºk\’TT.÷®ÑÓ‚™lˇ%%F<€≥Øˇr˙˛(∞ï¿{ÉÊ“]ô[__*¡^)≠-ññÁK B#É‚Ò«îëöyÅ™%ã»jTC%√'5Dúè¶;©&ÏBk´¯›”µTQ
Ï«Wò5©ê—U!\j$ÁAk@Ü¶‹º\Ö®Œ£¯‹%z´®˚ËıÓ◊ü
ÙSV—“›—ìÕ%Ÿ©;N;ëc<™$Ôû$‘êl”t:∂‹¸Á ≥bvaÙ¶q£|ëåÚÑéVIlÉÔØÿÏñú¶ﬁcÿm°à_5)ÈhbÏf°…#π¬ãZÉp4Wbd2´DmÕs÷—‚†viì≤êEj≠YÕHi‡†hç¢7çW—¿ÈCr* AdxÖ∂,Ω{›n;É0@ÄÕP˘ÇÑ 	5‹ïy'è˜µ:…L¥(]P£ÕÄÈ‡â0(∂&g3Å5ì„2Ú¢q¬LÒ6ÇÕXè¥ûóè\ÚVj‡⁄[∆ì’˜qqü¸]ò*ƒX“&_î,À=0ÒD[•¿_Â3Õá˜ü.¢a©ÙRi	›\=ß~ÖA◊D˘ì‰å’øe/-*‰f µ{ˇ’Ó„/PÔ·£ﬁ£WQÔõáœ˛¯%ÍΩ˘®˜ıÔ—–Èª \z˙ﬁ=‘˚¯ÒÈoÓ£”Wˇà∫_ﬂ;}„œ`‚Üµ-¿©dK—ëd  ‡Ÿ¿&Ú≥åUá
TË|÷N´/°`w[QêQÔ+¬2GuŒl‹“ÕZ5‹˛ö¡?&G±¥Äﬂ8’tä@ì>«ƒ≠Y∏è∫S°÷ÃaRPÑØ@btèqkßç_’ç	úe∑-’ﬂ≥§’ÀË?ïWñS¯pÂ⁄	¸6ÙAq\#)◊¡L0±3Éw◊ôˆù‘>Ã«Ï,õö±1Â´!~8©÷æªóPﬂänwÜ5*áa†,‚å∑¬∫=+⁄~≥ß{Õùê¿@-Î5h<XO›Sµ´—ÍËŸÂr!q±]Èbè”µs	‰ﬁ}	n>«îM´î™ﬁô´€Ìé:–Mvz∏}˛òÕ˜I˜ÕΩ˜ﬂ~8<«È}xÏ≥›üæﬁ{„è$˘ò£oóaó—ac=å‚t·†¡s∑’s¨¿§·9]ÔÉ{›æON3Wi/k¨ËYµ2™Ä0T!p0	[M‘∞œú∫ù≤€m|LRÖ0À÷ ŒTÑ•dddñ;pÖ"7¬◊Ò¨ù’’……GqÃëÀuÍóP#ß≤ﬂvùví`∂nÉ÷G≥gà«;9-Å‰î*∫7]ªΩZﬂÁ≠AÚ0®x!ƒ1W≠"J +ã∫ÆŒ˜OZ—#pê$"ûãÖ:‚ë9´äŒ2a˝`Àﬂﬁ†ÍØ§ê¥“Õˇ“Ïæ˘è›{üÙ>∫7√Òàˇ“§f¥Ó£OŸ◊d‘¯ñÄâ⁄üÙWo·&Óøz˙ŒCD±´&ì‰1Ç°qÖâÚ⁄Ö1‹‚õ{ˇÇπÿΩØzè^õAŸ<†áNÔé‡è˙Ùö ¶&_Ñ;~ø˜Û_†gOüvıœÚ&:}Z˜w?√Õ´Å’1Ô€nµÌÏ‘Í∂ràﬂsôH1˛…+ºﬁI“$ÁºË[ïÒŸ⁄ibXq‡Ál˛*,°yt◊∞h√˜]€Ø’´Ù]÷Ïªp¶≈˚X…âÂ{,≤ÜD—$ªm±È∂ ëΩ∑ú‰`˝0… ≠÷gêR¸£(on˚ûÒ≈“ë=K4Z's÷hÜΩ+æás`GÍ8˘ÏåW÷ÑK”¢¸æ£XµË}xü∏àväB ‹ˇ„wIôÍ,N,ÉèØYJc£§0 ﬁæßÔﬁÔ>zﬂØ>ı„ëÚEÉ¿à˚#*ﬁéÖO±Jè=Ö˛7{éG;èyÇ÷\≥IóÍÄØƒL¢xÁÊîÄ·û’Å!Üwl´N{ts∑_{7˙[û«8â© "Ó¿ŒÂ›qëÄIn¨ŸÇiIó3ygtQTÒTò¿Î·1Ö©Œ=;¬|ÿÛêW¶4F Y≈_˝'‘Ô.õ°èaFR±Ì*®¯¡œRøñZÁäö>Ü®áıèC©"„xHÜæ(ÃêÇ|ÉsF w_˛±√h˝g"ÑLÀf˝zFÜràL]÷£∫¢JA† ‹π’a≥º% OË£Æb’rÔ5‚ºò
¢Emêˆß‡pî¬Ì$^À4‰ÍÉÒÙ~9:æ^^; ëH#˚.lâ ‚H∂'¬ ôx#’Æ»UæDŒm∏IÊ˜ÏªmkÏ∏≥S˙¨¡&][Y`ëÊˆ-ï©ÚätΩ˙ÏÈcîP÷ﬂã-R‘„2nÚ;P• y™∆Ë∆ø4yã”%RèK›é¢‰˝LÚ∫u∑µeXÒQuÂvL¯>E˝ø∏W>|
Æ3n™t˛8‹4ºÄæU™´hrL˝(y™±nuú-R“Lx∞ô·•y‡˝yN$ ˙çH1Ùª0…¿◊løü39i(Ù>›üA–é!»|ÄîG$ì%Ç°ìgÈ¶B&l/Ö√¡Y¥}ŒÏöÂ*?¢Ù˜âË∏FR‘Ê+û )(π[Ôó=n”U2î&Ù∫Lc‰…É[ÔI#ÙzÒUåÏä”¨∫\£à\L⁄,4åOÿ€öÜfœß´…~Ã¢mµ%≈îgz≈ùpËeæ€–~È’èÏ˜40cÿ∆¡=€áùÉ=’ünÃ=´Öà±T’ﬁ
≠ïw£{ùNÀùôò¿ÃœÓ∏©FÌN≠ì™8îQmπ‘58·ÓNd≈)ÚØd´mﬂ≈=•≠úÆ≥»™Ä›*rHkûJG34!œ·‚Á¿vıïÎ0V◊ÑÒz¨WnOÈ˛‚+t˙OO{üΩs˙ﬁÉÓoøDTq%FìRµ÷Å‚ÔwFc<Ù|Fëx'5ÆÑo21‰∂:^¢ö6⁄’Kd "·;.^aYr¢ØíŒÍ˙è∑fP˙êÅùc6‰4 ¶À§H¶8ñr1˜≥Ÿqî!0ª7ÅÙÊ1È%4@)¥˘ri˛ÊZi´¸ÚÚ¸÷¸ ç’•í
aO‹£ä·ëÔœ˛≈	öaØ∂m◊nVlÔûãäÔYôJ	'ãñã¬Ø‡&Ïb÷©T!Ì%©5F‹#q©JÅ˜
ay∞ÿ‹q.3Ä^ÍUº|…t≈v<Ge¥)·hL‚”ƒﬂäeq:¬oi±Øm.Òk»˘]u,mZvÂÜSÖ>Ñ^Ki«µ¨ëTZâO¨;¯uÒÛwó4!8g·K˛ëâ!ë>÷`µJe‰‡áiNã©ˆ# =πïÈÇßZ$5£k£Ãj8!Íõ·ΩSÄà∆áÚR´ñGpb$ôÓ€ı˝6CØ$7∞Ï€‘Å…Ñ§P+Y§é·Aq£±Uê1‡p§)
G⁄ã)áº†Fu¶ïú“±c a®zÔ˜§2j‘ ¢8 +æ™ãΩä´Ks/ó÷0ó/-Ø/^],-(ãñÏe%x0#bn-7zrÙêÓÖbºJ¸ÿh81jXá…¸RÚV∏i˙E3iTÈ1≈›¡
≠\∆õÄ®åÀ,|#Ù´’ÒÚ M©øu/k vÃ¬°Ü≤îmªj∏í+´´+À ∂¥2ˇ£ÔŸ: K∆çññK7^|©d
ñ*Ûh
ÜÈß!eΩMOû`ï*û5©ok§GÀ—#mÌ%[áB2 Ÿ®‹é˜rë≈ß´kÅ±ëN ØÇ÷$g∂bfãâôNﬁ^n»/1hÌ$ÅeßºÓ§.qêtò¥ˆ;©Ú41ØÈ$›J€©◊∑-9∫†_ﬁÔ:÷ê)¬W´»ó"«#6çà"ky¸¸1¥ô™UOÙH[Í§\ Âëó¶Õ ∂Ñ≥tπ4H≥v)Ln'HT‚ÄuF)∞Œ®QQ‡.≈ªõ´ô9ÕF&Kæ∞HêMr£01πÈüm„"Å—…•}ùlz<7ˇOß≤cT„H∫{xTwí
ê-Âô¥RS°	Ò¯ﬂ'®Ê.9ï;§òk{ﬂ>ëh∆’àZßU¬yƒ§6…-Ó∆UÉ˚‚v˙Bî®}{&¶eF‡ÅOBJ⁄Q‹ƒL™úp√<≤¿I»…8	j V(å{ˇ`“ó!5IŸKdÜ$k©[yÌå∑iÿ«¨L°,9/á/ `a àP‰9gÑ8–lÒ˝[5¡z-7Oá_5∞5ÙK¬íØÑÔ Ím¬5iÍ(¶éfNXïZê√Qjjv¡µõHª(e©≤5≥¿TÌñmuf>°y)õ£ıZ”∂⁄Æ®Kéd¶∑§}À$ó(^~∂Pê8Dó6,H-ÉôTñêÜˇ±¢UÅıos˘¡Ãûı‚ñä ﬁ,ØØ‹@Û+ÀW◊n†+sK(âñm'y•Ω{‘m†2
SìâsÄö£>ﬁ;µvÉ“M’\®¡kz⁄ˇN„ÒA}_õÒfb¨mÈÂ}ê∫o< t¡x‡6¬‹5ë6œÕyXQ◊éQ*ïÇOXÅ#Î0ÉàQùÑyPH´yÑıó‚ìÊ$¨B*µ‰BŒ[1ìfE$Í]†aÆ¿fß¥ÏGbpÚP8C·=ÁÒ¿9Á‡3y	«Oe9© xoP“ú}[\È∞@†)⁄$x?>ÄãÂQ≤æ√bd±ÿhÓR+˜ avWë¢ÀC◊M I$ß±n8-úë∏¯yÿQ¶≈*B
kvΩJôr<π‡˚9î…L€†@ƒCÃ°:^.pNdéâÈDcê¨ˇßzd¥˙EŸr¥îHy2ü
¯Íº ™.Ifè™Õò≥$A¨á_´Å∑˚/ND’ÔEqª\ìW;LG®H…EIzJß¯Ÿ'ΩB«ÙdÜz3ı N!'i©%¥*~≥H¢9/()‚˙⁄Å2S“Âπ:ˇˆyÔÁ4Âc*"◊áîgö‰P~Ç~TÖ
¥ûÉƒ≠ÜYpdæå\§ë~c¢ãŒ≤Ãßº◊˚)Éˆ!sÿFè¯’∞úõúKS|rp»p˜wvjêoà∆]TéÂˇdÌ)ÍsyœiM¨cuÍf-aÒa¶∆Ç´åÔ`’iÌ∑æWä¨ØRNÖ˝QçÍ–¥‹æ4≈i¢—eá¨(™[U¿Ë	xŸ|’ŒãgQ∞hNª„s>§^ëT‡T≠N’ê2E¿o/í∫±xå¨Ç•p∏m0”nÏ⁄â/¬ú0–úè(ìúQ=*óçÍQûK'µ»»˘‰ª,d„ëX˚1Ô”õ¯©˙≈…‘å	K!Ô>˙ÚÙÉwÂÂÚÍ˛È’ﬁ«_—t«ÂÚÕ´WÁKÀÎˇ(wÍHúÕ+¢kR}ÃPPv“n:˚ª{[n”çKÄQ©`˙Âê§]™í.áêISñ±Zm¥]ü…4\)ÊÈ-y–õaéä¡ÅäALÜ“É“
~“!ª1îiÏâ£lñÓ®óƒîƒ)ËgLê\(ó–,*Œ8ªÀi¡°˚äµõ∏¢JÔ=z{¢˜ß/zèÓa’ı>|“}Îî∏Ê@2¥OìÉœhQ)?ànj@ø1îjLAÒ°í¡Ò’Ò˙DDJ(Aõ, ¨¶g—ªo˛´ÖHÇíæ´∫b!3É¿£I°Ì˛≥„4ãDbj¢ëB»,˙–iÁ˚©
Ü≠ãgQe;dUú%Œèrñ∆a+êöfÉ¥…⁄)∑„¥VÒÙYª‰@- ß≤(∆ïóW)£a•ìù+ı5…Ú
Ã »>TúÃXÿ»€ahx@†ë·ˇ$ß∞Ç;ø!hº±§≤û0)´P¬eLÓ‚èπxâÎÒ±X˝}#3u⁄sã»1h9Çk‡Ÿ
B„•Ö¬ﬁ˘á‚ıDDaOö”Xlê®\˙Å¥_Hﬂ⁄ƒâÓ—©Xø^Yƒ2^ù7(-©¿⁄' F5ñÍÈ∆Ò6ÇØ$ç…	T/ÅÀ6Ñø.’m»úA«Ã´~wL~q/e”;I ⁄≠πı“⁄h8∫]6l5|ˆ`/‰'(ﬁgÕjë¶·Tõ¸–œUV|È	,ƒ6XË}-6•ú*ï´Pw⁄ˆ÷VA{Y¶gx‘ΩˇjÔ√ËÙ£ 8ÛÏõüvıà R˝ÍaÔ£üQ|ºîTﬂ2¥π?O∆$Ùg)Tã∆4Jî⁄æÕ°
®	IŒÌ†fNπ‚:|µÊB‘~$">¬á‰Í\—wWO˜Y.–Æƒ ≈
2íœ'Ü ˛Ç/D*»jœ Dä-6∂±Œä≤êGPw<[π2dx‰R˘˙‹⁄‚Úµ≠’ïÚz*ï
sÅ¯ãqåGåﬂ`ûH?b‰¢~Ç 5Üî∫S√ØB≤≠iıëöwÄÆX$´#AO˘1˛@
ûaè¯„!a,≥«ÙXNÓ-¡7ÈÈ2f¿ÔA+ˆp{s.‘î∏9'Ñ£–:ûœ}Ãa0&Á≠ –‹íCº{®\iCÏˇé”∆_$!L≠b›$,&W¥“Í‘µW¬uX0ı≤VΩ˚ bèp1Âbzﬁxaß∫SŸ©0¿Ôç≤ÈL5S Lö9Åg™™X$p[°…¯∏Á¶ÈÓ˛‡ &«#}|;tÎ6HjÖè“í·kM†bäw<ä*ã≥`(P>ÿd⁄ºyb”ÊÕ"à0äòù·áà∑c‘Y∫qmmnı˙‚|≠ÆïíÛsÛ◊Kõ!∂=≠Kú‚∏}¸˙!ˇxP§,¥∞x(QkØ
ç1˝˜ßHÍãwªø˚úî˜˙o˜ﬁ¸
ı>y3 ¬—Åæ+åâ|Ω÷∂Z{µä7Ñb·"Æwâñ¿D=p^¸.t√UΩ⁄ª˜U˜çO—≥ßè|`ıΩﬁ˚ËÇ2ﬁˇûV*{Ìçgﬂ ^÷∂Ω?>Ï=zÌÙÉw…˚±ΩØ˚’m8Ng”WWÀ$7Œ˜ë˜l≈‰÷)LBiSÀ&©>¡ëérd#Á<3Ÿ‡ *36Î‘Å¨YÌÜêÈ“wáBà0L:˚ù®)ÀÖË8Æ≈ÌÛ4oƒ‘8YR∆ªlØ⁄Àÿ…ã∑£fÄp|îAFF|©1WAæC¢õUõv"“IÆ^B|ÒC9¡n,≠Ã-l¢”ü˝¢˜∆'ΩØ†Ó/„çxzÔ1Í˛·’”¿ﬁ#Ñ…Ó$nÆÙ…&ÿïhW“Ïÿ´ÖKÅ^ Iíu;yQ÷¶t°§öoTÔ]…6ÖôW">:Ùî° /GÀûnÀ)8aπÊ˛‹‘öÔc"«‘0}íÔM|ÆÄÏrœ†øïI*ﬂb£aWkX°´EÿJTGâä∞
∆kX§–¡˜Ce"†—PÔå≥ 2´8éô˛gJTµ‡iÚ0}ñ<‚wK„;fèæπè‹_:U(ôvQˆ@dÂuzÉMÙËR_˚–ií9¶Èª`dlAe¿êØ,fXˇQz+’)$aËékòXÀﬂùÖ]Z∑yóÿâ08X“©jlÄ±È≤—⁄Ü.¯cv1Ìr∑Qpi65◊ÄÆg—Ú>ÿöí–»ËâE=yƒá·;ºÄ©(-˙‡3¶s@“-¡ã»4h˚ —ø†B±ﬂË÷~´
IË£c≤…öà:rS˘¥¥_πsDµ‚®DÖ$`(Sdt£÷¨%a5¢nÚ yDEÿ¡Ò4-ﬁ€9á*b&ú–ø«â—ë⁄m"dU ¨*µM‚#ßËf7%∏;¯‚˘æu…Ÿç¡ßªånˇÌ∑ˇÙ⁄Ë˛ˆ˜ß?˘ÑôLP˜≥O†t- ªâ.ú?ˆﬂ„¸¯DÈ⁄†ôit!Ÿ¶◊“È˝/†T¡Èo~—˝’áßøÊ´ôÒ≤ts˛G/£sÎÛ◊—ZÈ÷‹ë¨z™d?à!•U,=¬UFÔ“ ô¸tSÍ‰Zu‹N–…0°6˜11zï8s…˘=8v‹lí3JÑR◊1)ª %·.zìäd°yÓ∂x∫ï<0,‚Õ,t§´"÷QªU´åÅPﬂy*¶…7>AP≠jb<∫áO5ßø|
ÙÙ>z[C´ﬁDhÑ“&+l!#KËˆ Jπå^Zú__Y{·_y=ñ,Uï3heg≈®tÿ¬ä19L%Ø;˚mL¯ù6>˙Gh0∏SEz¡ÒT'ﬁ€¡Ìª¥‘◊,W ÕàÌ√˝3BèÊ‘ÙŸÔ—FÔøΩ›{Ù¿Í˜^ÿ{:˙ìgx§"#¸≠ﬂÛ	)˙FY$∞∏ﬁÎ∫èæâcq–) ]X\_\YfÆ¨ß•HØC•†‹&¨n‡◊Ãö∞~U€«RàJ€Uª%v{p∑íÅ˘w.·ﬁ>Ÿ’iÒ`qì-ªs¢x˚ˇ≈,Ê≠ o˚Ùü˛ı˛ÙŸ◊_l¢Û«∏YÇP@·4Ò¨à∂[i◊Z@¸'c»{ÉáΩ{_ù~Æå †É’“:‡£πeL|„•¶≤˘t–tY‚†∞∫°˜/Kc "òûAÎ`g≠‘âÚÜÀ{Ñi‡äÚsnømπIÊ=¿ÓWQA¯æxZê=1E¿»Åq‡s¸h¯?DUΩ˛ËŸcÃ(ﬁª◊˚Õ„Óá∆¬Áµﬁoq@å:Nvø˚ŸÎ‰F¸»Güˆﬁõ›ÿ}˚AÔ}=wÄûÊnÆÕ°π’’•≈“Ç–6ºÿ⁄õ4X4Ï!í¡tìArrv–zªÜg“…´P†ÕÔ·S¥›‹ïhﬂ‰ôï˙Ñí‡&zãà7˜ª¯pH$Mê°„ñIç]˘IQﬁïˆî(ΩE{LÏá‹ﬁˇ3&∑7v}N\ö?}ˇIÔÈ71ìπá)ãY Œª†?^ET5ö¥ªÓªÔˆ~˝tLBb–˙˙ ≠“Zπä÷◊Áñ ËÍ“  öﬂÀ&ös¡áO°çxﬂÜJb9ÃVhFB∫‡ó±«s∑]#ˆåòPÆ÷Í é"tFÔ¶7´»å˚5ûÃB7G»åd“ÏŒÔí˚àÔsW 4ÎÆ=œÓ°1∂Õ5È›:í≠πs˚«3kü¯ﬁ÷ù]LV¸ù—Ô¥sèœ-eª“∂IôàF≥wGrB°∑ê;‡••(∏Õ‘T$y"4ÂíaÁ”˘&	ªâº√Z 2—ÿº·>%C‚Ó1‡H°ªM>Â|µ÷Ñ§5gønwö°”'Ëﬁ˝™WÔäâË˝}qV•Jµu¸ﬂôØ•[∞Ÿ¥T∆ä\∫M‡˝Ò¶≤ÈS°g¸gÕxJ>ìıÁ˘ˇ  ˇˇ‘]Ko”@æÁWX≠Ñà⁄Rà8Ë°⁄´Jÿ…6RªäÌ*Âøwféwvv◊Qπpâî}ÕzˆΩ˚Õ7”ıÏ'n]:ãUL”:ãO≈::Æ€N¬ˇ[©◊∞…¥!¿ﬂ bë"£ä†Å15&ñiu*[±
y∑"i$¸ŒQ>Ã>+ëG\Í„Pc–*p8úùt ˆ«ÍLØc⁄›úπêWóD*jZd´?∞´≠pïÉmBuÏÆl:;ﬂ—¿tìÜTq„ÕÂt“JE~ÕÍÏ”vÔ°ıf‹O{qbNÏÿívî3uÈSÈâ”˜>¸ù->œZ;_.Øæ‘–oã•W`$⁄}_‡}nÏ—êÕ¯ÙÅòZq8∑µRëc|≠RY£Q≤\Â⁄ˆ´—Ω†€ëo^òùÆ⁄ƒ‚_ÑÓº∆óß<@P≠\Ï¯ÊST≠Âÿë6»ìÛ/ö/Êô*:QjPi2ù?eÖ|óªjñ≥ﬂ…µ∏h[À,9:Kõ√?‘Ÿî±ëŒf:h5ä^n_yÇ¶≈fûªx(°Ò·‹ï’)ı(t∫œMû[‰J√Ö˜íÂËlêﬂn‰2O˙ -9Ù«òá4Ø5u8ìñnI’r.(èÒ¯NX)¸ˆ1Vy1ªpçW:µz@≠–4§ú˘m_∂≥Ç2jËŸﬂÙv|˙ˆéÂï‚IM$ÜjÉä
Ã Àwπ^àiÕê˙CÌÒâ$û°áyY√íùéœóÔª—8QKâFﬁ»Ä=d-Ü?ˇm]'ŒÁ¸÷Ê8ı¯¸ò—|zAPÙ∆.,Éºb€X*4d,ƒB_PˇröCÛÃêêƒU¥x(-Y&wæXõD‘£aDIø"Æ§ó≤q3ì3%_*^F{ﬂC⁄»Ô!V⁄ÉÔ-ãπ,†ΩP0›˝Ò˜¶F+¨ü" ïÓ]õÇTH7C¸¢q\-*÷ƒ›d0õ«Œﬂsqü5´:Awòx¬B≥·…‡  ˇˇ À7~£