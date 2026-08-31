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
        let baseDeck = (playerDeck && playerDeck.length > 0 ? playerDeck : INITIAL_CARDS);
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-sm bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 font-black text-xs">
                  üé¥
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-xs">
                      HERO MISSION SYSTEM
                    </span>
                    <span className="text-[11px] text-slate-400">
                      [ 1:1 HERO MATCHING ]
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-white mt-0.5">
                    {language === 'ko' 
                      ? `Ï¥ù ${modes.length}Ï¢ÖÏùò ÎØ∏ÏÖò Í≤åÏûÑ √ó No.01~${String(modes.length).padStart(2, '0')} ÌûàÏñ¥Î°ú Ïπ¥Îìú Ï†ÑÎã¥ Îß§Ïπ≠` 
                      : `Total ${modes.lexúÏΩ{w«ë'˙ˇ|äÙ@cånÙ0|Ñ(¨H  …,N≥–] jÿ›’S’M Çq5Ü}¥"}DØEãí)âæ#[≤Wsññhõ⁄’‹{ŒÓ7—üÏ∆}Ñç»Ã™ ™ Ã™nê2eoK–ı»gddDdƒ/Z€ùùCrŸr]ÀnëãF”t…ˇ~ó,⁄π|·ˇyÓ`µ„X≠ÌL”ÆõnÆa∂‡È±\€®Øvßì)éì—¸Ëÿ!y…tl2g8u≤∫ÔvÃÊï√ø#±œÈâù“Ÿÿı”uÎZÙ≤¸"\#µÜ·∫ã–Ã3#[sèXPõõ≠ô≠éÈêm£ù-íÕÌ¨€0:fv:ü'õ∂Sá;Ïø>◊€{ŸiÔgπ
qÏn´n÷≥nì∏;–ﬂ´Ÿ<qÕ∆V÷≈^∑9Cø›é="ÈÄ€6Zbª:Ê^'ª^(¥˜6˝õ’ZŒÁGŒ4å÷v◊ÿ6…ô3g»ËU{îú#£˝/Ù~qóÙﬂΩﬂ{˚ΩﬁoÓçí2JáÛ¥∆¨èûû¿Z“VæÁí-ª’…n6å⁄U÷≥i:F£é≠`˜övzS»Áü'ôq~'¬_«‰uK¶Hv©ùndH≥ì-¬T4L£óuÃÜ±g÷ΩyÎƒ&pb
ÊﬁâMH|ÑcÉvé\È˝˛”ﬁ/Óëﬁÿˇ…ÚËÛõ˝è˙\'ÖﬁÁo6∫»ss≥+™f◊fœœÆŒØ6ŒÂ:Vßaí˝fÓˆQˇˇø?{ø˝¨ˇ÷«£ácΩ?]?>∫O˙oﬁÌ›Ì›ºﬁ˚ı]ÚËã{˝ª˜»Òáoˆ˘ /Ùˇ«≠ﬁoˇç>GÎztˇ:È›x–ªÒ%ºxÁ¯Œ√˛á∑πﬁ˝˚˝ü˛¨wÎºG˙˙[Ï›x≥w„„‹ïXØf»ï˘k¶≥Oö|1o√òÀ%0¸÷v” ›ñıœ]SXÆî¬a¿…ñc7Ÿ™'eó´fãˆzˆüªÜcπ–[(ú¿h;uÀhÂ"´˛ÙD[úN¬ïÉâø'óÅ‘»™i8µÚ¥©cn€–á≠.Ë5c”%?!ñ+Â¯#[≥å Ìf∑∫çRH!B!…\‰ü∫n«⁄⁄œnöù]”l±2ctñé!{±aV∂ˆnvè≤“ﬁÃHÀŒ∫5«n46áÑ-.L÷°h”Èò≠K8Î±Í¿1åFctú4åM≥Ò≤‰–øw‘ˇ¸ŒgxA_·Õ∑‡°Y¶¯‰p\]O©™¶tÅÙæ¯cˇ'◊Ér∂ËÙeö‰ÃY“Ã’ºY•+ﬁì7
z’ﬁ3√î£m¶—Í5V÷Òçî-ÊØ+Z}ûﬁ∂$mªaUıpªë·|uΩˇ›0R’…Q¥~ñﬁ∂$mÎ€›◊_èå˙ÒœæÍˇˆV∫⁄¯Îäv/”ª√ñ§mwÕpªFd%˝è[˝˝™ˇÀØ“U»KP4}éﬁ∂$≠6rM£ùÅ±ÑI«jvÀÌ£÷±Æ¡∂à≤çYÎòı9±*x=g’ˇAÚ∂cv∫Nãd$∑Änv;ª%ΩG»UsˇÃ+Y&‚«nÕ5¨⁄’3ô1UÛŸß›0ˆW∑ˆ2£;ùN€ùôò ÷kv‹\”⁄ªjur5{Çu∞Ívlˆˇ	wko¢Xôú¢?≤m«ºfôªπfª4:&Î&˚@ë´ë·…∞‡Vg¥ˆïÔ™zlµñ|Ò3¢Iww`W	¨ff[ˆÆc¥πlg7Í§„-◊Í¿nüÊOj]«µùl€∂Ëƒe_owiZ≠ÏNvΩ4â‚óz€c_GdÑ}ÿ0+o£|5í¡ih7¬bﬁswå:nçÓà¶¿Z +AêO˘Ú=øPÑ;∏›Œ¯ıÉÄ´*yL>aÒ=ó}§¢;íg–Jˇ€|K^ˆÈ	∂\duHÎ0÷Dµ‘∫Üí’˜ª∞¨Äû©hñ°‚“ €î;0¡).ÌpÕµ^2.î≈óAH≥]òõÜπ’Óÿ ¯LIñí'ùÜ}z!¢ëâX5V´›Ìƒ∆°≥ﬂÊ⁄C|.Øç.4âıÛ˚]Ä„C<f&ÀòîÀ–UÓøê1s oõù-LB¿{jÊ¨8”9#W·ò
A®^r˚ù[Ω∑ﬁ~ÿ∞{ä∆ı˛èˇK.ó£S*ß”≠ÄÿŸAŸºÖz8>oä0Óûê€»Në∂É?ˆô˙+Æµ¯
xã«Ñâ° q–]AE€≤k]w∆ÓvVyQÀ‰óB5ÑÃHÛc.Œy·…&£ﬁ`";GdNGG•Î[F∂éµΩ√‘œîîÀôåpqGˆXç≤ï~˙ﬁ:*∆áDÕ%∆¢˙UÑh4¨K ÿ≈≤LÒ„RÎ⁄é	ƒ˜¢É$∏⁄ŸGâ™lÃ©ª§¥„ÿªcQ˝´iX≠®‚
Ï^yTm §YüÅﬂS®|ÂIX=ÛˆfX	m?úòQi*a¯á†;ÌgØYÆµŸ0‘πmÏ#˛¿˙\(äŸÑ‹ÊL®‰≤Ø!Ó√E∏øÀºAn$XóÇô$JµLd3Îó© á“W¶9“„ûBÜaÿ¸ö≥õm¡ö9æƒ9>{'`÷Ë}≤∂c8∞ÁöŒBµÔTCæG
í˝Çøœ”9>C¬zº_Ïñæó…ïf°pÚ<)ÚcX—ÜÆ"u®»ØÛ…H˜I~üõNf"™fk.6Ÿ7›∞,võ/⁄N®◊ƒr˚§ﬂˆ∏q2^XÏ¬ƒôo¿:hu ÊPﬂñµ≠hàá ´ìå◊Ös9ìøç∂ëñŸÊ"; ã.mû™?¯⁄y£æm≤ïw&ﬁ2¬+√Å‹>„–Ω8|mﬂheß+‘FŸΩP
"˙§â…<Ï5⁄Ç∑,«Ù ul◊ïK/Â“ÔÈ 5,h.â–´U˜jrØÓá*¬ÔB=¯5]5¿Û;;ëäÄ˝äåÊ&î'V≈Æï±È™´Éna∑"ı¡^πÔ’∑o6êaâÚKBç¸ d™*qª6Íë*õHBA¥ªNªû:~I®ï_—ut4.π≥Ø•®∞•å t!±#LOÊﬂ|Ù_?IMªﬂ|ÙŒoN@êﬂ|tÛ˜ˇÒÌ—⁄◊ø∫ü¢=˝|}˜∑'¶∑ÎTæ¸˙˝w∞Aˇw±Ú4*˝È¶ç˙dˆU©
CU˙¶R°∑Z†éç3ƒù’ÍÏœê¸8ÅüÖäJE6Z0t3ÙNÅæìWΩ(æ¯V¥x˙≤—Ÿ…ÅñKw»ø'˘\æ4?Kc™R@Nnò/°åRΩΩª⁄6kTZ:Ga ∞	Y(#®/÷ªé¡˛ŒÁ∞SÚ“Âj‰i’∞¬úÿê_ò‰ßRY;∆&›ÊŒ‰ø#ˆ«¨”¿Q]Ü˙2H8ößõ9¨”ne∑≤ÿ≠óÕ˝ˆnÀWÚ‘]∑∂Ë|@…lÒÃ∑Ë“¡\$∞É´KÄô√Ä]ˇÇπetuìÒÛÌˆ†√ùf¿âƒ‡»Ø'º<ïõû
Sy¥=Å∏Õ/ãÙÏ9Îœ Öb¡‹Pûÿ
j+∑Òàõwô	≤;‹®‘å»¬⁄àØ\ÏXı:Ù@Ì®çnÅhÿP≠I√±å,µ˙ú9∏Ú‹óaAä^¥sœDÖ÷C◊∏‡|(='◊ò†@ù[õª»4∏ó`Äˆù7úòu'¯D’#–“–ºà
œ’x—ﬁ»ıºÏ˛ HL˚;˛f¸¸u:Ø±!äGg6ÑÎ”|Í˘!pﬁ?¶÷
…Qó™äì6O«√ntúnÈöR%gÁ—3sü≤à/F"ô¢^¡≠bı‡éj>WÙI-,†¬]≈ìÌ?6S°±¡ë“∂ú i≈)K◊WÖˇÄf4T-ã⁄BË®πf”‚È#îÏ/Å4ZÍ%"‹NE7y∂8	Òiàn–™Ø-=p
HNŸºëÒà¶8v®\⁄¿≥ûƒ≠t—uj§€nõNÕpπ≈}˝T®k¥£úm"/_JÄK3VçÉ#¨Ú'?q®Ÿm{FEj%‘vEO…Å6ú´Ñ‘∆≤|Ω#,ÁÛõ@˛Ñ,Á¸é±~ÈBöqRúf∞ó5ÎDv||p«ôÛÏOlﬂY∂`fVáú∑˜ÿy∏ô0È‹â¥˝*["˛±Dt´ﬁ…ñ®Qo'[¶G¯=ÂK≈àîQòÙ§åm«®[PO∂c√ûÜ>/Ç≤{ˆqCJÖ|±¥a√óºëü*îuÃË<,ﬂm:˜dµªâˆ≠Ö÷UfmUèO|Ñ|{¥’Ÿ0Kwùul∞—û©YN≠aVçNµíæZŒ??ÓloôÈÈqhˆx±\•djlú
>m√Åw™ßÚœè#bMñ
≠.µﬂKN`Çè∫À¢±O∑∂πW°O?>ÂPs]˝L∞@õ§ggÇ}Åxfƒ‡¿ÂP"YÓ∞Û*]G–≤®mßoóeV˘“‰aå{PÃ∫c∑≥\ællìÊ~∂¨Ø¸Pµ¥8Ìÿ†Ô5…–7Ï‰ ëH ®°tågùŒpT¥IKÜ%GOÂ
¸îC∑=©MB)‰u‡êLŒ“Ôçë÷ 	”›mb
dK¯Máo≥—uÑ=êsU6ƒQÇ™Ñ$(-gG^‚…8ìCH”ÿÀÓ¬ˆï~√;lvõ	Ï˘Yâ‘ûRb—J$0ÂÕ‹&Ó„k–Ê;Y|4ôT√`ó%	Ì Jˆqa´˜§‘]g∆ØtÇQ¥ÉI[Z¬X=π›ú…=âx¡˜}^hmŸÉjS¡^Uå(OjœU˜Xuó)BR˝k@%àÌ”æ⁄Û$Ê™õGBaqÔoŸâ|2QÚïÊìi0ZW$ˆ	¨cI6"ˆ1sn«n/Cgåm#…P¬>ﬂñ©?P≈.,U4¯dö	è+Ì5Ï⁄[+∞±R ﬁÕN29k2§ΩlÙÒ∏9•∫??Oé—=Úâõkt¬¢ÃV#54DÏ≥2ÌhàVπœ˛—«ΩﬂˇÑÙæxË·}ÊŒ±cÔí¶[s¨6vA‚º|Ù‚úv!®}àº'N®GŸHÇGào»¿‡ÒäàAaHì»◊wutªµﬂÁ_B ’ﬂ—Å∑–˜N¶© ıŒX‡OÌ?sÄ~æ∑∫∏JNœÌò◊†G+ÃÿƒúMÚ!±ñiÍ‚ÿW†Ö‘öÂÎ“˜ÅŸ£¢Ñ∞8Èü[ ieﬂZp47ï∑NO«WÒ˚1w∞CÒ†ˇ¡√„wæ¢~\G˜?xp|„~Ô·MÚË¡œ}qèGlêØØøCñãŸ¢D\8ΩHï÷Ÿ∫TáπÜ¨•’93Ç2fl¸$N=ËpÛÍy…l¥Aow€QˇúYvö∂ÏòÆŸ™ô·‚\`R¯.{U"ÅÍŒˇ§á{≤}Ez¢'{–‹≥:…≈âÃ ¬∞ OC~=ª^ÃO'{≥í6®iëb%~WÚ√πùÈ7(ÒÖÙP2$eI|÷ƒ	…lWÊÄ(Û”‘
SÂ÷åÜâáï”ÙLµ®8TÊåø°=Éıf.eÈ¢Ø)ó#J{•è¢ÔƒàN`\å,¬ÛLõ≈õ´ˇæÅ)°êÁΩ‹)•+ﬁ¿{a]‹‡RÌÍ>uD",àñ•Ò vJ±Ìa’.⁄h¯ÊLwyc*˘˝¡êÕjƒ?Ó+“I^…jéY«’˛—Ω„@≈™$Ò,tàGâfLY¸ë¥¶0pkºfPKõA[ÄñW[ª¢∏/Ù¸-g≈‹eÖ®<≥e¡©ÙéV≠vA≥è@h´‹ıºÛCÆ˙ﬁz°/:∂G%Ôb^w&ßôÉM¥Q€Q¯·+˜hﬂïUb4Û≈
•î†ìe’{|<¶‘seúq£Å§∞lUí” ÎHF∑"Ì›¯∏ˇÀüﬂ¶°úp∆ºˇﬁuå=Ì›xì/ø˛«?Ôø{´§ˇ´[«∑Ô†˜8{¥˜õØ¯™ÑÀ˝£á˝˜ﬂ…ëG˜ﬂn√É,º+·•øs≥wÔMê\∞îŸ:Ë ›ª˚Ëã?ﬂ˛è#U∑CêwlŸ∆Ü¢ÿbwAıcé√Ã_›h’ëV≠mÍØNÊç⁄ΩCÏ≠-”qΩxSºçj1}€„∞≈òS.ÈÅÿ…†ìÇ£«8ÓÒèˇ¸w»ÒmÅ‚à,
˜Í√ˇ…Qˇ√üCÁIÇ˝˜Ô˜˛∫ˇ¡(ª˜˘—Ò[_·@˜ﬁ<Í˝Êã#Ùê0Öëﬁ˙‚+ÛÙj'bÕhcÏ5ú√ÆCÿRÓÏù z G^Aﬁ∫/±UÃâò8%Ù5◊I›ÏVÉ	P†~Q¶ÆùÖ©ù—xˇ≠/1:F„Ôı˛ı&Èﬂ∏Ki†ˇÔÔÄ†˝«Çç„£œˇ˝¯›;˝/Ô–YyˇgΩ_ …ﬂp§^≥Z-ågfd (¥f7€ìÜ9˚ƒ
„¥\≤owicj¿˘√8V?XŒ…7äHL≥yP1B%!» I2¨Á«QV+≤8¿åEw"µeY„ÉÜÍ‡gÈl)⁄3
bŸ…√õXl”UGõ·«¢‘·ÃÔ’j’≠mY>›Â≈ΩPM'Z€≤R°Säj=U5ü*1æù\{PêlˆåÀ(/ÖÍ»†ÕÔ–ﬂË˝ünˆ=ô•údˆÂiêYÿG0‰ç,£m61ıÛZc7™\B´xí‘3©ëzha	V<ÂDÈ„4)jœa7y|ÔIêG∞ä˙‡◊*· “oçV•—Üﬁ'ùÑåoì“H/ˇï$j–a3≈Éh)¯	˚ñ˝P√Ù3Á4ƒcZ.Ω?k⁄”VπÂû !tª∏`∑Lçô~»E™±NJoËåñÍ{° OOHÃ~˛}4æ“BCÀú~‹|
∂—u&Dj@KaØ«v(µu*•1•	1çQg>Ñ-)?å˝P
£3\™MáS”aº(˘éÕÑb)«#≠”ôySY˜≤d7˚>û…QﬂG±¬s4ßˆ¡fùàF∆®Û∑'ÆÁ´˘jˆ£*u°*ñ+„Ö ‘xÅ∫PU∆4ûËû—1|íœ®©†±A MŒaèÇJ‘OÕa~jÃÒÉÚT[ãπÅ$0£.›A[QnkLâª¶RiVw,≥Qümòé∑À*©	{¿©)€Ó!´-G;≈XçmÒúW‚’¬|Ø=”ıÄ;{–…–ê*ßZ÷Rï˙#P∂Éåûûÿ)fß‚Z∏¥˝)√tægÇV"ÌPﬁ/’ä-∆$ºZä—ØÁø?ò@HûÀ2…AAR…∂ÃÈJEAëjQ¡£èkí0úåEgQΩã%Õ™‹Õ&A”.L∆ÑÎDOÊäñoØMé^&2œBE <ã¿;ΩUº	ç©©¢Nœ"Ò¬∂Ì1Ü©¯¿˚o ÅW-?…iKòCX÷†2÷É®'Óä∞<±ì+˛0QKv¥ïÿµ´*õ≥è¡^uR(’ŸÑ‹â«˚VDÕ‚ö”*¢‡åu”≠ÖcZ3Ÿ °¢püõfÛ0êINπ";˛+Â∆IÃXÄªy*∆-2S5j™ ôFÌB*¨ò *èç“≥”1v?,Wl≠aªf2≈&ÒÔ»EïZ¶∫#‘*Q÷“È^€ûØﬂﬂÇæ(Hßí|+í∞9£∫◊àDõ
¸([∞P∆$ÊöÔ¢ √LõRWöÇùˇ˘ÍR~ú˛ó+˘äÑDÜQz¢™í‚ËA‹<6£-*¶µ%˙∫R$dHãÁ/À5V≈ûê«Î•S´J)Oäv—	eà2
' îæˇîG¸A˜≥»’ää ÕYø˙òdheÙ∑†yÃá¸âÍiFë¥Û∂L6åˆ∑[jÑKe¯LR_$R¥nj‹˙§äã\‚L>=%ëOKêû≤,∏Tæ˘t@ˇX,MÏdY!îE°¥HÕV˝§“Ë04∑∫$öË£≤û4VJ†ø®,àØDI“3⁄ òIÌ«Ô›Óê⁄·ó^ñZ·øB≈
söTHœYÓRˆçÔ¨x6ü«eŒû(Ï·'æBÊÑY,3$ó£8-„ÑÕÃ°j9åÊüXﬁõ™P±¨Ù>m—a,$ƒJÖÂ∂y¥ú∑≠ñÈ∫z%?NÍF≥w@|úzåw‡Î√X‹À„ì•ÒÈrjÉ;W t~æq^¡‹Â)Xä,¥oH<(¯≠m3z»5ÆÛß&l» "^\¿õ˘nö(áƒ%õ¡)3”Áï#îñ∏∏x¯=´ÏacΩ'ÌÖ∏≠N‡SZõX‘u}?%1<—V^:—&‹ø&,[åÃúÜúeÆ}È˙HÖÖM¯·ª')Hr ôÂ‰ô}$P≥àŸ˙LX>ÊGd öZâ‹«C¡Ô§2PˇœüˆzìÁ˚…¢1†ÙXÃö!öC(˙UÈ:‘‰k∏åÃπ‡oïeu≥(ıM—Œ,	@¯_A’àÛ±a>FaòèÌ”(˚}pL¥≥Œ¡c7Èû¡(¡;‘·%
âÅ|Ëâª⁄¡Pñß√1/ù⁄Œ( œﬁ…Rªm∑`Û–¯"–ï˙t@ÃÈÃ≠9‹ò#Ñ±3¬•ÈÈñ/i ?áüﬁaÑP=l¸º›7Pæ˚:jåÍ(2¥ŒÒ&ÖX≤Ã¸ŸñïFPÜF9ﬂ£¬É'Ö í°»D(K≤€á|æºc7ı©<âÄOy*4ëTõH%U`C›v¬}z«ÏP
πf<oîtœèGós≈+[ŒáOB‹éÆS–!«⁄´/±6äÙ´]ΩrË˜‡+#WQá’‡1…ß<¶ÛM“—ôä.ö–@°·-Y≤ ≤èwI·#ªrt&‚ƒ_*2D®xha`µq‡zÖ–"–5ˇ&ï #=◊i3Â@õ)MèON·ˇÙ<.Aù∂ö€#£Î‘Œ\ÒO€∞‰öπiNÆf7'NÂˆ& ÉüpØmüsM≥~ÊπÉ(óD$•6}<™9‹◊ŒlNö•≠Úô«Ü—ËúY±°âÀônâÿõˇ’¬t]C¬∞ˆêEôu…Ëò[¶„ Ù,˘˝3#-P¶¯•ÿ”Q•B∂£Eß^Ô%!}ZíëÉÍ÷ns.UõètµnvË–GVj*c"≠µËsE—¡oTõ›C+êåK∫\/2¥WB∑Ÿnõaﬁ`${ˇËaÔﬁoX®“HˇﬁÌﬁ"´ˆÄÖ‘¨Ì∑MÚ≈ú6:€6›´Ò\‹t.òµ´<Oïµ¿Oº%w22ëî!Ö≥“VLÃìîºûè‰!`{”¡Íã=è«3AŸ?˙yFxyÃ,–¿*´»›oôŒˆ˛2´SçZÈû•“Xe˜3~„b€∆É^ÂÃÓZmÃ0&´«®_3Z*FÍÃm±ŸõıûêΩn1àıgÁ÷ñ´≥^ù]\õΩ8_]ò[Z\]˜Kó&ÉÁêL•EÃ-]ZZI*É∫œ√ÎB?(ˆ∫˜5ïsé∞˝È±<%,™»3—¢ÎñõÆÙ–É∫
Ñwºt¬„≤^˚szâw?2u˛˝U≥É, ÷Ã+œÃˇïÖÂÀÛãk’’˘5>_	≈–D££à)údÆcøÇúe8àÈ‰{Í7ñéÚº›Í∫á_øˇÎh¢Q::¸’jÀÆn‚ÉÍ·Q ÕGsØ®¨âÅßïÁáU≈'Ë∏í–hÑ€˚∑Q†˚})œå{¯ù˘%é&PîPå'4î|"(b4di8rT¢Øå^ëúÀÑ È@¶‘¯÷ ’EsËn*¿æÇÊL§∫rºﬁ)Fnujá¶-d˘b˚ÿsëv⁄É\Í5aX,á‰˝ôÏE©ë7Ûr∑—±⁄ÀtÄÄ_ƒ”äLq®¶é`Ça⁄•∆:Ê¬Å@¯˛bâ”?ÌœAò!§j±d_-¶√±LM2.á◊êÁL5aÄ^zµ±ˇöπŸ±m…aUºd5dG`OAÉtÃ_ÇŒÖá
ä≥8¸¬cÅYEÈ∫‰K◊!Ä”¸îLæ÷){,·îOm}W ”hÅí%ªûœï*fìCfÒ)1‘˙@∫‹esR›ÈnJ]–•—«¯∫÷C@ÏaÚ`FˆóÌCBÜb°˘çÕ∫’m∆‡—%'5åÖ€‚võM√Ÿß…•wÊ[™ARüND®∆áÊÚàæ#zﬂÑ„nJAFyﬁyáX<Ví≤}F8;vìπùÓW€é˚õÎ¶$ıIÜ†!Ùäj	V≥ÃkôÉQÍNtl†∞Uº3ﬂ∂\Dá®ŒPˇ#πØuÜòÃ·ÛÉÕvJıH∏<ÿa›@'#Ø¬w.Á/v$M‹X√ÃôÖBò4%^~@X•w.˙™ÁÚU<ÖÍ„Ù–›µùFΩj∑ÕV’Ä°}s˘óRË*
v‘bçáôé#M˙9»»ˆƒ≤/)ä˚_>¥†/ÍMTx~åì≈8J|'zG≤à÷x[‘ÂâßuØŸ€€3v™©1M$I6ûåTbπ+Ò©ìê èÿ∏Oˇr`ù»<„Ü/(Œ«Üå88U¢?í#í∞⁄∏Hô3ú9l
œ¥˙V„oV…áì˚–±ëê∞Ùe3Íπí¥ ûÄ∑Ó¸æ©ÒŒ‹ltUë˘˚,£Gÿ¸XªZÂÛŸÈUòõJË Bå wy Ø¥C wa_ñ∂∂Bóe˙çäƒ’"V*Z®ÑDI _Ú›⁄1QJ£ÍÙîÏ#8qyoé‚	»ËxÃ%˚xn]÷*PK‰$b@¨6	Kèø¸jxÃÜ∑Êÿç∆¶·`Â∫¸>¢’ó"!¶RêWõã€»àÍ{ë|ÎÖ©Á7<<ûIÃì’∑çÎïâSI8¡@⁄ò~ñÆ:≈ˇ`ªœ–\ ähW·cπóÏ⁄UûGq"˘ye*ã§ÖDÖ°¨ÖztÔ$ú^-b¥ 5GvÃ ~pˇ¶]™îgpßÁÑ™@lt!œÅeÁ—Z¢ﬁ?–$([=0,äﬁ3ë”∂cCÍh&ﬂ6[¶La.∏ëZ;Œ≥ú —ŒèL√•V¸Ü]c:0ˆ‹6àØ0ñ 
òé]Ö=åÊvaœééQC0˚Rê¶e>,Q:<(áª	:ã“Î„‰?≠.-ÊXÚb`ôpßUæ<IÂW∑ª∞)?ÆZ0u´Ωlv; ™yÙG»¥@Fdç∫-7®π€Æ„ÂhR°ﬂv?Ùz{€t^2⁄´ñe&íî/Qá=Ó!ÈÅ˚ºœ9r•ˇ„7z7Øìﬁœ˛–˜ytˇzˇ√ﬂê˛›{Ωﬂ~Üí¸x∞WÓê·ˆeûEãØ8uπ…*˝,®∂cP
Èx´˜ˆ{˝ª_QEx˚˛Ôz∑ÓÙﬂP˝ûâû3ƒ?3‰ äY≥õMÙ=™{+ë‡ì§Fê√%õ(®R√l€¨?sEè9'AÍ∞˜ÂÉ˛˚éèÓ„ Ò~ÒqÁ-Å∑ÕÛ∫ÙcØùtm“âÌço‘EÕQ~,;7Ω˙‚vpµXâ»È¡≠r,_ˆ «LîààÌ!Øπı|nzj#ä˝ƒLÜvÀ9læóPD9*⁄mÓ_úï`ê È0Hx°L6óRÀ◊ÔˇöÙˇÙNˇsÌ$—æ¡vCëíFSÈU•√Àóæ¶qÙêjˆ‚w.›ÁY]tÔóoﬁâ6?Côb’ÏPƒOÌ.äVôÒ ›…Jùoõàüz&\L9˙‡q30ètkkékfÑ«Ëì¯HºtOjcÊ*îéò¡π≥S≈ﬂ§g‘ááäWôòÁd,ÎÅ&"»óEìä(™¨N≤ œ%÷W€É'*A~[·µ+Z–R±ì2O—a*‚âQ—á$©LèJ˘Òby£î1ºÑ'fºßêÀ7“£Êfv*¬"Ω¢yOà[´ªÆ+µòk√±;‘:bò∫,Úd#	g>a£";8`⁄p«‰À Ö)A‡¢≤éMUédaC\( Ûà$p\wã±ôDß‰!›íˆÊÊ˛Ë ˛«1∑ ›*=˜€§îé»ÃﬁrENÇÁ[È"Ú±.1™ù>]AàﬂqL>:¸C‡≈ÀZQ%Rá?<,0t‘èXR
	¨b-A◊v°ÉïX|N™`v≈∆«7±ÈJEpZ®TDîàDÑNnû¸ÇºŒ—§±ÙΩA%_ùèê«D⁄ rŸ™ÉkÂÒ¿Ï•Xå2pTÄ"êò’YYûëN5?6Œ·¿Rpt7ÒNπ¶qEjfßŸå]^≤w1—¿2fmê€ÂT'i1w}≈Û
:èÍr ù¶ŒÀ¡°äRIã8«HÎ8¢w•ÿ≠ÇZÄ∂†(e™`“#¿˚Áç8ƒÚ'•qRfà˛≠n3—üYÕ·—(ïGr^±§±ÛOË`˚(Ào\QèL¢0‘æØ”\˚’ÁhìŸ	Ûb`Ü˝ı	m·'Â¢˜ë>7ﬁ"Ñπ¢A⁄€gPõ◊iêÔ¶’ ñ≤ﬁ*ÀœÙ¥ÆT¡ÏÚ8™A˚ø_E»Éÿ&rÚ•∫ç	‹ÒJ.ı	â2Î£v∑Éq‹Uó”è˙‰„ﬂh£ouu”∂›é‰ÓÆi\5[íéi≥sj¶woS≥ƒe8˙#f√¿∞{Í&qÜE‰ÃÀS33~M0å£:3¥¬ü;6éîaá1J¢ÂdhŒ¢ƒÑ≥ætòa‚gd6…¯⁄˝S£+®ÉÃ„IVÁ`ÜP˜ÙÈa©‘ª<ü÷Ã@•Ñ®éÂ[y-À£QVLªÎ¥A≠ü¨`9ÙäóÔ¥"é>rT4Òszµm8WQóU€lıòc~IIª»ê˚H≈ﬂG‹Vw;99:Ï1”zÓ¿◊CŸ6s≤Ó$ùÁ™÷w<jByz?Àt VZ§WùÁeZ∂$˝ú}t∏©1ìß‡~WQõ7ìëRu'%”=¡ 8∞q~ßQ¯Ãœµ d.É›®	s@S¢5ç=´	l˛hìkñk±uñ£2QPòÂ^lªvöÇ®n∑›9õf√9t†ŒãÀ´4˝Âπd∞t»e(˘º[ã÷Hπ–7]D‚g#~<ë¯®Îö¢1`Sé„—⁄sÎÃÙ÷l≈‹:î⁄ÚÈØ◊=àÄX]0ËMdmØŸŒUê»ã€†Áwg”∆ÑhË2#oÖÃúÜyQãeB]‡≥eÜq†j©©≤õ]/NRèœ˛∞$¬è‘Û9YÌbÇDmﬂ„¿<A\£Å5™‹ﬁ´Àû=jrº0U/äLï∞∆ºvùb=xñY5hƒ¶BHhß√†Ÿ£∏Ïü≈î6"È	EÃœ_ÌΩ…é/FŒæ∂¥ÚÚ“+kdumvmuÔ∆xòî$%ùXç`–iˇu%N|D•( Ò‘ÛÈ€>ıfÂ‡”»¬à6≈H´íèÓG°¯∏ë≥,∑ÉE∫Éhy≠≈x∆ß˙√5∆ãºZ˝Ëø(w“Zˆ\“lPàZWÀvöFCÏ·)®≠©mΩÊcì,ˆwõîK`£‚gÙôBæ9¶Ù_SƒÈÌ¿˛ √ÜËH†/˙ç"RÖZ˜AkróÌñŸ—Æ7EQπƒ«H*È|∑≥ﬂ†Á@KùùoæltvrM´cï'ô»ì	R»√¬œ¸ÿ·ÛW‘é/É¬+o|›ú—∞ÀtÀ¢„XÑiñùWØt{ÇewÑÿaWû\/õ¬1j)ÁÈäIú"4”D˙îw*wjÃÔjiÏpõl†ètùVÁ[Uáz	±I\ÆÙoizg*Ô%+AÃﬂx∫] ¶â0cØ‘o>z˚«rP≥‡äòÀ˜—ˆ˘ÄÙn|‹ªqãÙnﬂÏ}Ç.ˇπ≈·◊£/oˆﬂ@f0kpÿ[ﬁ—ÒõüQ'¬w˚˛ºwãÁ_~ÜZ^3WÅg4ë)£LôÂ>íˇπ≈UÔZùöπeä≥œå»ºö“≈(…¶“ì◊p¥8¬ K Ì¶ò‡¯Ô§õÎuÑî4‚J\⁄m÷E—‘O”ò´h‚ﬁCõN†cJ`æ¢Ä]GËßeÔ:02+XECGﬂ|Ùãü)h®ˇ…ıﬁ€GËn⁄˚Ú”G˜èOˇ~Œ‹ÕàÑ¶JßD"ÕMÈemvô¨Ã_ ógW^û_Y%kKd~Ò‚Ï≈y†≤≤t~i-BIP[—‘úËŸÜ#®M¡¯f…y™ëπ˝M”iw[W…"˚é‚ı*nìE2‘™ÁQ'TB∑|«®∆ìVLØÑ”Ë•@QÎœåÇQ47bÁÛ‹™Êÿ.êÜ	ïÚˆ¯»\ËSMòLÿ˚Q–0æ¿ë©±„h`±ï¸Û¯oú<[4äFŸ$Ùo÷îûãyÈn⁄{´îLg»(u€ y¯ûmÔûòÇ+˛#ü+V∆¬Ó∑!¡"Æx≥È¬Tô8a‰"JÏK0.≤É–§<#>\)¶ˇR‡<ò'8…6û¯–"Ø6ú`hüÕomëB{oúâmmÉ¬ÿ8â>;ùØõ€0‹ W‰“A#VA9ÑY¿PÇ?‰YºõÜ{ï7w4%0◊5˙ßÿûÈ Ûc7Íh:ôyc9Y¢êe.,H∫Õì5;p¢5hTs^/TûÁ€s]Z¯OF]'Œ~Û—ØÓˇ«√∑e{àÆö)n6Y/˙ıTÑz@d§?îÜ-¿†ö˜˛ÅLÜ(ﬂ|Ù˛ıA€P(ÚæñÛ^äB y,ˆÊÕAãùÙ∫Vã-ÖªŒ{ùΩ»ÿÙ^0a±ëªùÆ∫ÑUcúı|◊j†êá@÷˜|¢Ã˜`n =ûcÊ[ÀˆCŸõõ¢ê0'òô)63oø7Å¯M,qcŒdhjo¢ê≈«õ8…õ¯ˇ⁄æıŒÆ7”>ü
œÙ	Rl%»wøºïï†ï“ïv≤°Ã«◊·€ü“H.&JûPX~”Õ”üÓ_¸z®6ñ}¶ïóÕ˜_~·ñ2⁄dºM:È•ƒñæ(º∫≈åuÚÑÎB>ùßN¿`÷Àê “Õ.Â(…Ë}ÄfÑf‰á[°ÿåwﬁßüt æ~_∂ñ‚€óµçÜn≤Z3Zx‘Û ¬Ä;VQ£4
PFLb‘ º$€∏Eù&ä^úDêwm•Àçù)|Âƒ‹∂’‚¬@
£]‹´õü0X¿ÎœnÂ#ÕR%µàuµ¿†Ü©‚ÑùCÉåWeÍB(`q·DÖ(`£ÿe6Ïhõ‘‡P˚ÓÓef9BsA>∞çúΩ<ª\]ùõ]\ú_©^+ ≠[I–ÿÎXµ°†xäf,¸?&AÚ©TåFkúÅ∞.Ñ—‡ è"ı“≤€ûπ°èùÌTÛÖÍkF«µ[√lc{@'ÎÒı†[ÌÜÿÉru^ﬁ≤j√t°,Hw%q∂Úè≥õ°Y¿≤€‘qîO™(‚WÁ(∑P—@ù¬y=UÂV·£^ÄEˆ≈±wÈØÎ˘\a#:>4n÷qå˝L°\ÀmYçKÈ∆Ä2™„ƒR`d^uWhû;∞ØÑ}}CF7–±˜—*,·&Q7T’^ƒx}¡˙67k•@JÊe∫tÀë›Öy æû]üÃ«—:û1∑∂LÍ°Òä˝ëb<H‹ ÑÏL!#(Â+HH3Uﬁ‚à]îˇ%ÑO«Ù~	Îû]®ûü][ª4_]ZºÙCíπ¯ ¸ÍZvXaÉN9W(JX§(%}óº øòb{p˚_Ï≈2i÷g¯óR—õR∏Fˇöbû2…Å·m2èÉTã¬B]SÆãîRÑ∞çìΩíïá4)¬ŸË+äR˚ù4ÎJ+—œç*ë)ﬂF"XœÕ§ËG¿≥‹&äS¶OH‹k“[ÈaÅD§T_z⁄îÙJ=LTîBp@Úr9;˚ ⁄_Dö”BµﬂcÍ^zô)X÷iA«”úú‡&Ì∫’≥¶¯èïa¸0&é>Üø˙(˜»Ì¬˛w¯Z¸z√v]”=ºøSwå]˜Ç¢¡OlŒBäƒês#?ßo¡¸çú}v√®d∞9RíΩfZ2Ÿƒê	íaÓ∆^8ñÙôÔ≈.≥πì‹†S76Êπ_àŒ6œ?∆˘<Ä±Ëz\Ô£ch@úú0º 81}FÈä¯ õI OfŒie∏∏±M}\‘)–H ÍhG˙ƒÇŒX¸£FuëB∫òCU¥P4<Úèz!OÚ7*òÓr‡içq>ÜPöú°†«B “§N# ó”Ágn‰ãíÁûXà«aIö‡ vÀ7˝‚-“ˇ‰ç˛Ω#~æLz:Í}@qZË›Kïè)nÇ°Eœ"YQ„≤§îçk#cé±2ÄæÕîüΩlûü8ÑLK˚AÆ0=$Ëı˝E!?ï®uÊè-cÈj≈EI’îeòÕLÙ˘$Émí%Ö1xL∫˛0ÎBØ√ˆeè ÚzQPTÑ∂"jÊ)ÜÉù¶*1lq„*ÊÛ⁄ÀdÆ’*Ò3Pe"´5û˘^™yEÙRdº–m√€.Û@K‘øaRˇÔoI9íe µÉqd“K†ÇpP*J£
5Oå–¨VÜ"°„u<l. ’}o@™;{ÜÑ˘øòöcc˜°∆PÓÌ3%ﬂâ‰D*cÍ)¥uΩ˚Xä»ÑA…ƒw2Éµ˘ÓeI–rË'¶áqBi*‰„”hr‚¡E ∂˝/£˜ó∞˙`µ;!¢Ñêî`y C¯‚ÚúK2≥Âq⁄ì∏ˇ¯¨
t\é¢JEXéL AAEt2f⁄®√7∫¿‹u|;g’i∆®¥q–{ÛÖ˛πO£Ú™*yìbôZ(y]Züz5ŸÖÛ©¯ı=•^_ RÇ§V	ÜŒx»BÑkÜ:®ò€;|˛
Nz;zc_·ö.EﬁçJè•ñÄaÜêÅ√¯~˘‘xºÌÄW)ﬁ)éT[`|¯k°µ‘ÌåêCﬁÑ‰eM⁄›±ÊK»πœ<mì79Ä`ñx˚$Ö•—’Lö`ÍÇπetπéñRïcnìÛ^[bÒcMMf§˛&C¨ã@ŒÀ∏sU3Mäâ∏π)Is¿ü€§wÖ≠∆BOÿ1ò~â¯vÍç#lËå¿=y_õÇÚËõ‹sQd— „_P@„ˆ*jT„â~5Ùø\YöJ1B9leÄ]‚î?‚v71jï1`Õ£π\>ÈÛJ∏jÙ#es∏fX∞µrÜ≤ﬁ¶Æôö]êgvÇÛÌ®Z®«˚_EˇIˇúÖN¯_É9Òè?C•8b)#gµÅÂâùYØ`…Ét®ú¢Cìí—qøCÂ°:§º%óV¨ËŸ Åm’R¶‘‘Ò±§iKí’Ùí~c∫¬…pÑ∫tÒX¸˙&∫&ΩUã¯+
ò]x2Cô»cÌPiÑNö2ñ∂«C
Ui*le$J_‰ñ1w˙@KÅ'‚…æ“AS) …Èú≠EëëöNîò⁄IFÕ?˙ú‘¸ì‘eÿÃ’¸£A‚$∑5ˇ(,ë—Òs‚9¢ùÃN'’Ù‘ÚÜY7ßòTìs¬—åC,á∏HÍ˘ît]í¨U3:vóÅ?Yá]PÔ“su=üy‡ Ø¶ºˇÿ•%;®$Å6∂ï@D¥Ò.Î)mæ›¬»Ò«èí˜ ®£IY<¶¿˚d]∏ Í8é›J±m%0_	6ÜtPGË)ä‹$zîvÒù‚ƒà»H(0jcœœLCÖúé”m’Ü“ÿ9F∫S„läN' ÕñQYáT˙+™˛≤Œπ∞\Lêa'«"yüØhñÅbÙi:hÙ&Y\e˘‚üå,4;ç
ÏH≤9
ô°¸yJ"}Á)Lfhˆ¶ÈÏ2Oq&iÊTg√éÌöŸr•"û/œdÿ»RùònzH{	ÅÌÕU¶∞Ë©´Ú´5˜pÙFŒ˛hòb‰ß⁄´^€›ñ;L£ëƒ$;î•$@¥”o…p/BF)YÀ›Å˛a@t≠+±◊i<î˚êo	j”⁄‚Ü†‡∫‹$ZÅBvü‹T»l√å6‡Ì4&8ô€¯ÎËQEh=˛∂⁄("ÛVz,6ëQ◊llç>ìàŒñÓ!ÒE“b
°õf1ü¬ílÂ‡}÷9BO$€8ƒ«üZ√Û,˛+1Z¯‰Ù$m)§§6ãIHN◊‘ÏnR¨_¡ç™æi^)º]©¢ZQ_aµ™◊µm≤◊l¥‹3#®/Å∫¥ªªõ€-Âlg{ñbı£Xsf§T·yŸﬂò◊ÎºΩwf£Õãe¯Ñ†˜6Í$…K æ
#»≠¯TôÚÆfyôEˇ
‘5£çáÉ0¶°Àò∂ ø.LM£[≥Í ê–_Ÿ⁄éÈ≈zpL√±>⁄∞);]Ë§m +®üπ¸zíLì¬©F∂í≠ ·-¯]V-Í§°¡=ókÔÿ MÆ\:ó£ÓΩÓkVg'3⁄F»æŒÃËòvÙµZÏIL/ôéù}Ó ‘Tø•9∑›∞:ôQh›zaCeågJÔxΩP/oMèom’+ı˛⁄⁄‹í
Ã¸C5a¨_t˙∏TaïìŒtê4ÍlÿìLïäA8±A.mN∑&u&q(uO=6ª¬Pñı§∑-(Æ*ï’®∫í3®?©’ì™§Õ∫É49‚áKØ§ê∞‘˛w gÖaOL˝ì6◊è^€¡4`Hˇñ;‹¯≈Ü’n”Ï]Ú@g£Õ† ≥Àvª€Â“cã1\NœA¬†ıgÛ•¸©BqCà–'≈ô
@t#ˆEpaÔá%Ó ™ÜÜLÖ OEROºÑˆGQG:vï⁄Æ∆ü-lßKß™="à7U
V"yãâc⁄◊6hçË2SvÃflêuD …ZÇ$
@b6`r]≥:ôæZÅFá˛B¯ëgA$®ûÇ?Bµ &ÕÜÔ^¨»q]Bú"%‡¸±õùûòûÙUö∑1bª†Æ8ÎÖ¢,ÓÉÍg:|ŒÙ±¸±q¨Ôì7â¨≥ØxúRz‹ü)∏QhZ}VÉ“îà'VöJ ∆ù‡„ë"«R!WL™D… BŸ√ª#ÏfÀ™?0áJ6!Ö∫?œ‘`^≥h‹:˙{(6NÊ˜√≤ga
~î&Q˜,√èSE¯1çàêÖ<ﬁ)ÒV°\Œo®‘|01M
ı,Ò+ﬂÿgUÈéˇ∑Úia
°ç–^Lä"æˇ?WíA¡á˘ﬂ$çÜ0x•ü⁄}–Œûá˜È8%ç@ÆÇ}?EV* ®ßSrwU-R QÁÿ·ørxî*”–¶bqï'q®¶+c„ƒ{›9H≈{¥X¡…õ. Y‡£Scögî5KPÂ‰˚7hÖÚiîÀ˛¢˝-∫kùôU“õıJ≥^mÑKÄnv¨¶È≤uêœïÈjÒJEÅùóöL#ëÇâ|åCß‡}˛$‰r∏ÔˆÁ¬S=†™à:◊Ãl©>*oÄaTuñÓòY*˙à ªõÍ‰©ÅÔM™îá:<ﬁTôP«649H‘<âáóãÈ=˘ï2·π=Ûv&(ûºúÚüS©UcJ≈–üj$–-£fæÍ√˙√t3ÅvtúøÉ›-L∂˜ÛØ*Ri¡Cò:“i›ﬂ9cG*k«†∫x≠,Uæ•µ}<a„ánÜûà8æÍb’<`6òoóó“„RŒK—πÌ…3“bπ<>Yü.ÃGÎÈÊ°˛fä ùL
…ÄZ7∑«áM·«Ñ·¡^“r-Õ2»àè∆ù4o¢Ã:¨O[®RôÛTΩVú,N^—◊?3∏Y5E’‹okLWwRÕ™û{ü∑;™.'˘ãyE<>ß±t¨ÌÒ9êi0ﬂ’°∫ ◊¢÷“¥Îÿq√íÉ4ÑÙ≈—∂`Ò4ßsƒÏ ⁄2ˆ√1h«ê%ãT'>'Fﬁ>‚ÊE2ÀÄ†ú4òÜ˝±à<W'£“zCÆ€ŸZ√jgÒFä§Çã¶Q!y¡=ëcS5w¯Òw0ÔOzYﬂq+¬&Ë≤ÈhFÏáKØ`bùï5⁄â•ÂÂ•≈˘≈5viUÇìÔQµ<I3Ω◊VßÜÍÿŒV…0÷aS5õ#góWñ÷ñÊñ.U÷f◊Ê/úûh´V•nÒÈDDqµ`–]{4ﬂèÑ¯ïÿ6“Lÿ>·´—œ¢P%ÈAù¯ra~n·¬¬‚E≤ˆ  b.ó;˘|¯÷ÊS·)¢=r∞C°ˆ*P  “Úáüôó÷Ó´ıÈíÃµ˛–%!ì®∆àZB≥8¸@#j2>Ü“∑	D*√A—Ø’B+ˆÍÆi∆Q…ÂçâI…aÉ|»€»ü‹¯!]Í¨Yë˙¢È≥‰ıÚ√◊0©´°n∏;f=^_%Ñ:h¨VÖºª°iïb¶ñ∫8≠Al'Ë;5Ï$E¨^Ò¯S¡öî∫@âíãaØ#qH4=ßÆ÷tì∫â°ñék∆q˙ªã—Ë;4	†Æèõ¬°R–oIá§]W˜24Òñ√≤cœŒl»…"Wî.§à¨æ8ë%¨Ó“‰ì8 ƒÆŸBBw+ cµÈàí∫‰6îµF∞Íå†=<æ…”ÛãçXÔ£ˆtÖ˜≥mùÙIGiw?ÖÕŸO9 Ó~P“$ÚΩ;>EÈT`Tjjª3áÑº<ª6˜“ÂŸóaC’iÚ^JÇJq´Ã@¢]ˆÚA5lõÅÆˆì‘∑~]K ,è´ã· ˙û"-e∂Ó’.ŒΩ¥≤¥∏è(“Ã-]Üë!f◊fQ≤Ÿt
Ÿ••Y*±a$0å+?®Ê˜f_Tø≥º2ø<ªÇo]ò_æ¥Ù√À ¡@%'\:íã!…Fó›ñÔ.û’„∫ı¡cËnH÷ÏÌÌòÀÛÅÕü≈Gwﬂ|‹Â9Ò®?Ø≈Y/‰Û:◊pyÓJ˝π=ÌÅªcÔbÎΩ~*úµìé°àü\ﬂıœıß+*Œ†¿ˇd≈xGˆ™óΩ£˝·™>É≠oDê7u
[™)ñÛ—∞yL_ãQ.˘kª<‰•±Õ¸›á†¡éŒJlUï®ø⁄Ä±1
†s‘öQvê¿6*î•ñåŸ€3˛R¨Æ˛s◊®+ıﬂ¡cdÑº~,!ZIh∂¶]´f≠Î ﬁı˘˝6î8CXˆÍ!Zñd∑èN$É·Ò=»ˆÆf wÏFc”p–ØL›˙0≥b(6ÜS'V}OÅsjEìÅg#i≠ìàAºãa(Ó»©WA≤ﬁ≤∑3Éπ(	Kgö¸e∏m4ÆW&N©·"hmò‡zWoª≈∆ü9¿ü⁄≥‡MÓ%ªvQΩ–;·a•Â”Ω“æ.†ÆÑ`atáyjHDïƒ°√_“õ b•È∑J˙/O*“éWy9+¶OØÌê'òÇmË4j Q
*Ïnôg"€ùMr´[{ôQﬂBÔBYnÆiÌ]µ:πö=¡†™n«våms¬›⁄õ(V&ßËÃ€âeÁöÌ“®¨Yíœ„IƒKæLXíåäZ:ﬂá(æu¯î-íW¬÷√¬©¸å-*AHií≈+±Y°ê!6!}ì6€+$îŒ≤Ë#ØÜí\ ÷jå %reH,î#≥Ì∞gÎˆ¸I4Ö˘ÄÚ¿ÎòÏ]XXΩº∞∫Z]X\õøD1˘’Ö˘◊™û9∏za~ÓÂò1ÿ_⁄ ;≈ $˙kG
8=ˆ›˛ªà6›,¨˙ôtÁŒn⁄¿†G¢€f	≥!'Î…ºQ(oD—ÿ€(µAD.∑9É˚·>€}´ ≤s∆ëz¸≠á1å˚h$yÕÄ˜V¨v.ÃSW	VøZ¢>∞\,Ü	Q1Z%>K≈Ê(Éêä∆—á‚"pÙ	q
h÷Eœˆ:ıñ˚
'ﬁGì¢UFàPmûZ/Ê)ÁŸÒˇ‚Îÿœa‰âñ·h	.L:0ÏYáMúÁ.x<QxæÓÅ⁄0ô	é¸}+◊ÍdMFÛπíã˜èµô‹ôa†fñö9)i¶\í"<Tí.∫∂Åß;dŒrj›,=
0C”fd˘äd(…„4‡∏Ó)ﬂ/∞à’´V#î∞Ë 8Ç˚7ÅU¯ﬁ√u^í1õÆ/\÷À˚YBN√˛§Ë…	|2Â;2Õ∏*ì⁄sïXT«˜◊ÊY7»ö’ƒ°`˝%YÃå›iÏì:ïX1”¶ÀÊÈ≥y:k∑É{°kC=dq˛’˘∫F€Â	∂ë[.ä;Œ.†œ)~±Q{ûfÜ˙4mk”˘∏Pá¡¯€&‹∆}àÏ0¬Ã⁄›ŒkP±Ω{Ê†îèﬁvªµöÈ∫óªçé’nX(rÖ»C5€n¿˚-V«T¨êtÚuÄ„Kª˛åpŒi≤ªÃhÂL*ä¥≈¿˜<ºÚh2ËU÷]êPõ~è•≤*0·e†®Ï˚3Òµ®	Ø‡≥Fß∂√ÅÓ3(tR%..
ÒòÕv«¨œ ä‚¯ÃÃ!‚¡ír‚%açøÑä]–⁄47˙Ï·X¨FΩ~…ﬁŒt2£Ó~Àt∂˜´ˇ‹qöU::NºA'B¡b%~^Ñ‚T0N† ∫∏£”Ú¢a5TZÉj&hR®ìÕA.G°2„√ò09©«n˙e÷Ö°K9&1˚g!‚ƒåø¿y¥‘öly¢|0¢Ù”#.‘ÚKÂ…R rVﬂu6mBQKy]ôW04û9 ´≤+I`zìr©“XËÛW¯Ífá∂	´†Õ’≈)πë @¥ hln”˜óD˝´i∑lO++D¥2%^$…É|
±î2≠ŒzHgÇrƒ“û<2É©v‘Of∫¬¨¶\h√K~0˙-ÍŒ›à>4ìcQK°B3î¥≤®m%Ànf$W˚ZRah1u4l$é˙áF2ﬂ$[ZÄ¸¨
`≤‰Wz˜Ô˜˙3ö˜‚Ω;3‰¯ŒQˇ√œ»s°ﬁG±•–¡êﬁú!s!ÈçäÒ?"†”äãQ≠XN1ær,∏ŸÜé¿}]ôç{Y©-ÛÙ  jF◊IÈËÉs~âl Ç ïıÑìç+
»#9|•(c∑÷|~¿YŒè~Ñ;√Ç¿Ö∆§lHQ<Ñã:?ORjû4∂¥'m#,<>†c $AÒgU)ÇââëÆXAlnT•3˜PÊ´FÉú!œàã*óP§Ù]ô{®Å¯[´l¿r¯2Ã8å∞ÈÿU$‹*ì˚´pı%ÿ‹ˇ”Í“bé!1¯Â´˙-πöêK/M˙
–â‡KÔ‡oπWâ`vL4"Ëºˇ£®ÆëMÆcwk;ŸÍ%ﬂ¸£ßP1#Æb‡⁄·˛°å?aà√5À7[B‡o"‚^0]Q«2T∆ï©ÒB”™„π Œ0˙u·/ø∞â)ÂÈCh[™§Ÿñ¬”¿î],≠~ñ√îô9¸Õ,$äù√8Ifß˛á∑zoø«s:--íÃÒzø˝7“øqóÙ?˛yÔ∆ßc4«Ê§˜Á.-ÃΩL‡ÀÍ⁄“Úÿ(u4LQÚã/Üãæq∑ˇ·œ≈¢Ò°ÏŸï5(\ö©¡}ò4˘ÃàòÈìq£tâOü∑;“ôdªkq2È§ZL*¨&?îDô§ëêÁVÑxEœõf=ÿ∫5¢~§£(˜ë¬Õ¯=è·Ö|p÷xZn
a<L8#nkSö“Ùò◊6Á4c≠x$$Nã dûÙ,,Ã"2~D÷0ïèÖ…0_–@«J.+∞P#$E◊]h∞∆FeÂ®ì∏xbX¸ñ J ¶õ!:T—RfMÛ3ÆOGsÎ4ÎrDj-•® ßëàeÓ]-0œzoQÚÀåAô>Ïq‚üwyƒ)ßDÊ÷˛:µo\ÍjöHñ*ﬁ˝ÕGˇíÑÿ,„ÿ«∑Ô<zxüßÊÉGêS eôÿh<›2~Tå\RÂﬁÒjÄiáÎIçMö‰4Ö?B„E1≤GgVË9öY'ÃÀµ±œ·ë—ÇÀ¨'åú£VãÉåLf®qÕ∞hÀ‰ïú! ÁÃÜ/F≈^îs#Ôyæi4%‹òw^áv≠Ø-~'˙:zã∏¯ÁB]¶"4@ˆ¢∑q1ælC+GG£"iËô˘ñÚôË8‹|±è…Ó◊0‘mW>/"jó€µ:µ‚5W&·”µRòëa§èÓﬂ>~Ôr|˚”˛—b≠Ω¿z¥‚+öçÈâ¢Ù]˜h€B›Mx#h|R^H7 öc¬õ¥	õéi\çﬂ†£RL1*˝€ˇé£“øwΩˇØ_•ï◊†>≥ÖvWﬁ">(Ä√ª©«≈è5∆˜ˆG∆y8Ò–îRMÔãÎÉÃÍéµ’I§ñ’∂·\mòÈ&8ÙáFPR¸¡·◊Àî”Oz a√ìH8òŸ®SﬂÖ‘C$ hyCƒ/ÖÜà_{,CTIø∏êÇÓ›`q≠Å¸†¢5™!„óßyÑ&c ÈFà2Â'1@ﬂ[>ïÜr>–ˇ‡aˇìÎ§ˇ„7z7Ø˜ø|–˚≈›T´ldœ˘ñŸ‹◊–
Ö"ò´Ì¶ü¿i¬"~)4J¸⁄c®©Å™˜/•UD„~¨É‰Á«à]	ªt≤äÅN3	≥nπh€•)=Œô .ﬂå8*1ŸKë£Rt ÊbŸ·„5~£MKû„˛Ó:ØhÉ%;†Q `˝à2πã>f;‹—lóõ<©ÈS@Gq‰©ŒŒ±LÂ˝eiYí-°Q+≈û˜ÈΩÙœ(‡–.ØÉ:Z[y“Äü»iœÍ∏g÷@;ß⁄Ñ/ô´|¢Ô—•NıtZ$õA'58e‘|ù`±Ã™ ¯yFÏªÚ)‘ÕÆ¢yLH$ÿÄË˜S!*E0opÀÓ`Ï]5z≥rπ	X`."‘P~ œß¢gçœD}-}›∏V/åÑçc™ÃG™£>MÔû2Àä¸.†Äy'–… ÄQgó–˜√1•[sp∫+EéˆÓaÍ∏7ÀúÒ`u∫ÏÔÛçÿNÂ-Ãò
•Ù ˚$˛¬4÷ç‚®j¢&ÜäØSƒ’%’Û´ƒÖPLàpúûûÊ·pœ{—p@Z≤‰4B]z◊Y˘âXÃÔÉø‰´–˜I–˜Â´•ºÙØÄÁx…Ax4r3 è«p¶sÆ …ÚrƒƒûäÏx€¬PÛ—ûk-•4É`CaÃif´QÖ⁄}˝˛Ø”-uUtüü˜'ƒ¬`˜Ω kˆMÙ]•T(ﬁ•
wµÉ˙$
ó≤g”jmŸNÕdè)¨ÍùÃ(ﬁÆ∂ªŸÓT-`%∞ﬂä>|
;y‰≈⁄*P‚{2ª∑‹—EfW»w…Œ5;≥°Æ3?I-åv(	ìHwAŸ	Q£ä¸‚Ñ
∑˜ì’y§è~ÚΩäÅ»„ÂèÙAªSP3Ä•7™õùñnËÂFl‡OÊQo;[¶’!svkÀrò?°Q<È6#D‚e"æS,!>?%aÊ∞Ωî¸ ˙(JÕˆ¢F±óaÿOÛÙ∏Àçº^B≠◊ï™cWßaåÖ∑{´q9⁄ŸIæ?›%Åm±æ´ï`Á+MèON·ˇ˘\7>1ÔÖ^2©åkO⁄ÙhòÒ˛‡V5Œ3BqÁ‚˛ú8”MAØËbƒMµ¢Íßl”¨—òLQ¢»yØ˜E¢zß€˙P]Uƒo:ä(}˘Œ'=â}Ù˘ø?zxü¿øG∫Iéﬂª›ˇ‡!=•∏)dıïïï˘≈Û+íS˛”;%I‚xhﬁÊÌsà€í∑£—ò@ ÷+v‡ë˛Ω€ΩOn÷±ﬁoæ‚}√£Â/Óëﬁø‹ytˇzˇ∆›GüﬂÎøı«ﬁç7}yÛ…ﬂ¸¥wˇ~Ô◊wIˇÛ;Ωﬂ~÷ªuß˜ª˚Ë°€ø˜Fˇ›[§wˇNˇŒΩ[øÉWz7>S˙œ:&Ÿ∑ªƒÌÚ?vçVá`DgÈùÀÖeÿ©Ìú√f∑€ËÃêK∂ÎéI %‡o©®ÃG(©Ke—πqâ`5∂ìd∂˘§™t<(4∆…å+Ï≤˜YÛeâ º Ä R"
bdjWq‰ÊZvµn÷hÍfAT@ÈqdéJ“…TY&“œà‹ªU7OrORœäguh¿KCUè>iG·VÅíd ü¸@∆ˆ<Âè[Å¥XÎxÍE=!€Gˆı¢ÿÄJy}pGz“€7›™Q´ôÌNåÙ8@{â¬íÆßh◊Ï6
≥«n∏‰º·Ã–ƒWHÄ„‰≤ŸÍé≥0 Ês9N®≠fú,á— u1}I°†‘d¡,%?îô)¶”®ı“(—pd⁄ˆÕb¢–DU——KP7»u˚∞ﬂ8^Á/€õV√Ñ}`;¡ô \Ä˙ó€úëÖe…µøDæÇNG~ú§‹≠^Œv¨Ñ˚ÏÀ â2#„äìıì‰M:ym.h{ëG≈∑∑êkvÙî9»¥€ˆ÷8™&FÖ•t∆/JúÒ=ƒü(;“Ñ3ç2° Û‹√iåâãÇãıêeƒë–«ﬁÂKä*Tc¢'?øè#»˝Pá\)|,¥.BÕ∏úUK‡;I≠µ˚Øä`˜NÔø<`zL◊‘™- F™¯åÜJ\ÙoáPŸ^É[ÉO
æ?=4+=˙ôÓ∑Nlæ_ÉOuíÿ˚–à Dz1r5dUFÆ*ClÖ”	Lô"´-)æ5¢}ïRh_SÒ†Çò:®[‹È‘ÌGfÊ[ #6¯b†¥ÿ \3ù¶’2ö’Ñ±∆->T≈i÷BÖ“ö¢ÁAd=T¬Zv≥àÌ\Y”•FÛRFàÇâ–„üiÛƒÔ≈≠Ωùû∆òû˛é{‰v⁄#ãÈ»4πª˛
=aıÏÖhê»Æ⁄öÎ#ŒÃÌ_Ø@ÖÇkè[Œˆ‘eSHf©m∂\ˇÅ	Ô63Ïø@ê9ª~t7Ë9†E≈‰Ã_úfcXpAzŸ¥T∂Û)b‘˙TP 1Ê[q¢Ω¡õ‚a$Aµ¿¯ëûìb{@K⁄P;ã?-àa®[]ñâ=∆ù#π:ÙÓkÂ9rñSÔ˜üˆ~ˆêÙÓøMM∂oﬁ#˝£è˚˜nì√Vò!œ!Û⁄‰JÍvéÕ![a<áXAòËÜÚı˚Ô¸«√∑…£/˛¯ËÛﬂﬂπÕyõÓÌ∫π+€‰—Mø˙5æﬂªˇª˛/˜°–_≤ã{›ÔøıÒË!ôÄV…BÎ»“b(åuÙpÏJ¨„3¥„QFì·Ãc®œÆΩ<dW/Ãø(vÚ¸Ï•ªßŸÙG†õº ÷[£U˜˙õpÊtﬁñ+á»Kí√d‹êH\¨
“BÖ≠Å{ëÏ≠œ’pÛ$ÃQLÃR∏§ÑãfXÅdœù±Zh?A•QG»V(#&†]iz∂Ù„4@≈li”äëÙ+˝Á{O¿u"q/êMD"írÆ¶º8hÌ{«ÜLQJ¶U§à¯§2^XÇÚ@®»6 ÷SäC±h9¨»ì=Á–f£W!K˝•ı]çöãbé%ää™≥XUÿ{9|˛ÚÒ£F(ﬁla™PFºY^gmﬂ†—4˚ıb¿…‚äˇòÿ¿)Ø}ì„Ö©‚x±P‰∫w¨EÉÅByjlˇG«7B˙Ô>xÙ˛DÔ∆Ûl¢<çs z…°º∏o∆_HˆÇ:}Ÿt]hy¬KÅª∂€qÏ´ÊkVΩ≥sÊ†òãA(ƒ‡DqhoÔÙGsÀj4Ç9)*ˆ“TÄMßQù[Ä1˝√0√1‰z·Qs#è©nÛ≥âj◊l˝ö—Í‡Ï|ø<Ö¨`FKöEÚ•W.xö\:ù,≠AéWÌ◊Ã‡öü.˝+PµÜ≤"”˘m»Í5xÕÌâ[é˚?˝YˇËèøé~ó_ˇ#Aèíh–=ªà——≈ÆU7á∞kEÍíóûd·bæKﬁJ.≈Ì[ﬁJîò∑RHx2˛¢=a›∏4yTä’ˆèf®’Ái\VﬂÊüN£Rµ™ç¡¸°Iıâ—pß3oıuù∏PüÙÁª˝/ﬂ£DÛíŸh#n)N„g6C[¯lxo¨ƒÒæ’LÈ◊p, B+ã¥J›ı¯N ˇ˙º}+)Ω}+‹`°&;æ¿EÍ\·æ¿{nƒòÊ§s/Q·`æ…5‰GºÂÌMπﬂ‚P®ƒ¸]Òvj†3X^@ÿ77ÿ˝<o±àknRÚ©ƒÉÂÖ≈Ï≈ŸÀÛ‰Ú¸‚+
ê-©Æ"ÆF‚+w˘úRπ{¢?%“»'zx∆5áqê;˝aíe†≥z?∏¢ˆù∑•¡Y»æ%6ŸU≥”m´áÅÊFÎ¸õ1π7Á G=¯˘K{rﬁƒ”!ÅRÔìâ
»∂˙∏Bê∂í˘Ud…ﬂÖ…û‘µÛ$‹-lÎûÏõ¿ §\	à⁄;dW¥0lƒPÔ/π§œÎUÊ6”)ë√/≠q?OÅÅùuv`\ƒ	$µ*•ß∆!'Ç˘€ êNLÔ©Éï0aπ{–¸Op’?–P˝!p9¿=~¢h¬ìièru>?Ï3 êË…X\Æ~2È@ORœÏ«)èÙ¸ö5‹ëY˙ÚÀ{Ωﬂ<$«?Ω˜Ë·u∆cê¬:~®·à	<ëÁ¬H∑.E9ìî ΩÚ£ZŒ´ö£È¢]¢V\˙Ù∑,•¥
·ÁoWb)jü¥‹∑©Hòd˝L≥B}~≥ˇ·∑˘0·ÂË„ﬁÔBiõZ[∏Ògò˝ŸOz3Uö¡ßÂ‚»ù7∑c8V∑	R–2PÀS"¯Ì“À˝√—$D¢,Gâíﬂõb˚VkMìaH¬‚_ó|Æ¿µ9˚ÕG∑˛?Ìv†!ÏﬁÔ?ÎøıÒÒ—}ÿvéØ˜˚∑èzø˝¨ˇ+∂˜ƒË	â‚å§o9ªæ¥<ø∏q≤EUô!K[[x¨@Ê˜⁄fùN‚S≤öÇ=â’d6M«h‘ÂÀ…ª]O˛K¬ÇÚÆ˝Ì¨®O˛mÿ’øÛÒÒ;GΩæÍêÙu√…o≤µ'√'¥òº˘äÆ¶ÂŸµï•K'\O”3\+∑†ó‹≠ˆüíÂ‰∑ã7ÎI,™ _XlI±[—≈_ñªÚ∑≥ò~˛Û°5=∫ùÙ>yìmT∞7¡NÑˇÀßÃ≠%JåO‘X]R≥Ø¨ÃûlAMaAŸªò8yã¨9ñ—xZd=⁄*÷¢'±í∏D.]J¸^t-yØãâ_˙€YMÔ~5Ùj∫q∑wÔ”˛w»ÒèN*˘˛√?r«∞ı=°ı#xÑ–Í‹¸‚⁄	ó–©≤j÷ì∆º4€‰ºm_}JkmVä„íˇª'ÖßÎâ≠¢_‹Ze˙Ú®Rˇ›üÙÔΩA7¢Üﬂüﬁ†ã)FáﬂÍv¥∫6{yyıÑ´©4„YŸ1YÎ∂¬0BâOÔ—„pkâfë.%z'∫íÿ„¬B¢˛V÷—◊Ôø˜ﬂ>ôtG˙ü\Ô˘iÜÕÎ9~ÎnÔ∆ûe…ovÅS‡ZJ~äq%]úΩ|~aË}iŸv;^∫Ïfáf‚&<)8…@áÊÏÊ¶—!/öf›l‚Aö¥íøÄM[ŒŒõ´ı%~Ç≤_ÂoUˆ;o8s;Ü”)ùƒö≠_y∞ˇΩE˙º˚Ëœ_ë‡læˇ/üˇÍàÙ˛t‘?˙Ä'QÉÁDZÊ4ÒÌäà∞©≠Ωß%{ÂSÔÍßf˝‰ ?ÏÚ£.€“≈ÁªŸãKè=.,<z·ØlŸÖ˝‹%kN„ÁŒã–Æ8Ëö¬ˇﬂ{TD÷û◊ª– C/˚aﬁ_b·§√œ”yãPS“%â7¢b'}XXê¯˝)9ççc› ì
Xã¢=ã•à≥«oÜø&H¯À√Ωû†yÑ¬¡•9ñç^ó:s¶FAOÈ +ß	:nèú¿K≤vãsûnnSπ«J‹SÂ˙pa8◊∞›xúí
Ó¸qÅD≤¸≈P°a£A1Añçñ9@@ÑÄ√Ù]
à‚#RDî(4
(-~e™∏àaH√"*O&.B]ÏÄÅßÚíë,FÄ“PtÑyùÙA—Û„Ùø‹‘òó—_Âã'ª>ïø∂√Ó¿ó…<ãì√9¢∂∞n	≤É-tI„AsÇº$!á>‰ÀK¶Qe®ÒÁ-"N¡>EÛEúáÇ0IF¢L8têÜ,ºC“fËI+°…_"F∏D¸û2_ ¨òW8™E3µ≥û,b$Ä‰“Ñåà[DA:	~íz´U¸∆Ò{ø„†i˝˚ˇŒNfÁ÷Êf/Òl€‰““EΩ´‚‡ââj¬Ó‹ö…Vˆ>Tv®BøˇµÅ~Æ*¸ué™z'éÉ/äÎAc¡f]tö*µw¶¥«Gz_±#’œHÔ˛›ﬁ€ÔçìﬁÕÎΩˇŒráﬁˇ¥ÊıFScí˛Ω[Ω{_z$Ä0˘øfˆÇµÆ” nÓgiŒGöÅH‘⁄ﬁ6wú‘ç&V]∑∂∂‡Ç‘¥·qI@¶7B1 {vYóˇkH¶¢à¸:πW<Ï 9Ee÷7îÒˆ´U¶t‰≥	ºMÚ†®òé]Eö¨6†à°Ω›£…vë2uQˆÚ®Ó·EO¸ÙFôÈ?xhÒ¯Ωw∏0jé"àBù‡oÄ…éÉ°™›"°n…2~ttk‹õ“Ω>!ˆM7tÚ¨“ÂH°ÃA&ødπùÇáÔ˜ü}&z¢H*Ñ”AßA]of›öc7õÜS 2v√£D¢R%Öç6káÌDaÈLTÃ#F∂kçQ4ç&d≤≈U{IÀ	∂®ÿ‚Â¬
Øœ˜∆Ô{∑ÓípÍ#z(˙Sñ•w„„]Öã6à TCŒE≥ÜqùÏõù‹R¶Ø KÎœn”hg2P?]∂ÍÑøäQ†Iä·ÌúU?i∆Y‘¶Dì'ﬁ‹DŸ®ë›AÿÃ–W∑„ßˇSÁí≈Ó ‡'õXæKÃºœ9/]¨,Åè"“cÑÃX>ZΩh´*®'Ölò/Q
IÏ}f"q˜]m?4=	‹(X_xÏO∏7Åvù–Ù(öR€•xßÆY5	ˆÂ	ãRtKtfÎòF#“-Ô°äƒÌ∑†ì∑CçNRì5ç"Xõe'ÜﬁSï∏Ûä6«ÒIßÙAmEuôäM(•'¿ü¯|%¿A!mΩàO»˙AÀ‹%†¡:'V”t—e,◊±/°ÄiÆYò\A' RtùBqÜP˘eú~÷]Ã¬à[ò#‹n«]rÅë∑Í¬%r8v∏1Ñ§‹Ôi∆˙Ï.ÃáLö}(c∆—Sk_j˝ZôË<ûeSÇ≤®m^¥ÌŒ@ïRHTÒH∞3Ñ9≈ìƒaI<ß(ﬁË¸¨.ÆæäÜg6ùom£∑˙µrÆ®¥ü
ëJVèPY–W‚xA€"VêF9Òü0*•zO*∑“pˆÒƒcà•'ê[âF∞añûÜ±/:+õ”$HE“¨œ–ø 47“z•ÇyöÎ3ÙÀ$&mé•9KÀÏ@Íu|8Hõ^X‘ô∆±®ﬂßÀY«l4îÙ	úÍÇIÒ˚@`z’2w€6H@åÅ	Û»Rªm∑ı%£U'slŸú∑æ-C·ﬁäˆ⁄™ı±z≥LÄÕXÔà‰–Ü3¨pﬂ¢+3¥lôÈ∑‘È%ùõ›ˆÓ'àx∂∞ÄÎ3p:é_Ò°Bç1Ωõ◊IÔgò8æ˘)Èﬂy£ˇÓøë∑ÿÙ~˙_˚<†y?˘∞ˇß˚§ˇ?ﬂ¸›Ò[†5ˇ˙~ˇﬁÌ∞í?6æ,fXÇ~Ò1QIº†1ÂåŸÏ‰ 3’QUÏ˜/˘‰!§Ù]≥\k&◊∑ˇ≠?õﬂ*ú*Ùîc%j<I"Ûl¡,Nó6´¿	«)∂q˙:¯}lÉ¨£˘~õ2â,jX3TZ√>Ê'®Ëˆ^÷≥ngk´ùmu–eyø›¶Ïî¬@ÑEìå˘	±®ËKÁÙ:4¥<û}	¬„Ccá¡¸áÅypVNÕÑ_»^B6æ⁄∞ö]jSùô¨€$Û*Töò¶{ì{¸…
+œêÀ∏Ê9håLd¸Åe§‡\˚§A ˜0^˘aSB—cÈÅhâ}õI2ÉìÃnL'àgßàû∞cu‹È%zñ=‰rõI+»Ø/-/K\'‚%8›2/Œ÷ßÚº≥¸{°} *⁄Â›é7øÁr-‰ﬁ?˙ù_úø¸CôΩ]·¿Èô"FŒ˛Ø?+^:ª∂L@wUà˘]◊tF»u 1\b¥ˆQﬁÏçe\0Cp∂ÄÎ4—†«W÷ÇG0o∫µj5ªÿ¨z¯B>ê_πÏ:&Èidh‹ñKûÅÜ˙ï„°OHsÆúém∆√¢˙≈ s„Ï7˝˛ΩÉh´“Ù7KÒ{Húí…fÍæº∆RÈ±≈Óµ◊øÍ‰Ybi6,|è.Ôf∏<≈LH O¥T0≠Q(V≠„JÄKÁ∆L"ñ+v≤Õ" ‘2K/mh\HıÀdÄîS±4=ät©ôCaFz¢ÑûÁÇ¬£˚öz¸Ûª«wéàßw„Sr|˚AˇsB{•’DFÓ9:¶Ñ£Wó«“õÖãõ&eINø
€I”Ù≠“˘∏«àû8uÒ«ãö«˝¡«W"ÃÏÃ3ı0“.ˆnΩ¨ÎÈÉõ˝üﬁ|Ùá˚˛”£≤W"*ÄrÎÂr€4&¡2QŒb
$4&çsÆ…≠Ïayîm©·-1¢Xê¶]GÕÕn_2ˆÌn'ö„»„¸(t3√lç ‚V}OzÑVC@X¶´4#L»û«¨œ¡ãı=:–:ÚpÒ÷*∫ız≤WÙƒ,Ú’1©§K†∆Ù‰val<Ü„∑ì¡˘qwüº∂ÎyÇ¨W¶¬[ˇ$˝3€˛wzﬂp€ò*hΩ2qjCÙõıï.Å6P2¬íQ»00˝˛ÿ√èºª]*¨˙à	Äm,81ÙrflúNç‰U©’xÊ4+sÁ	˘	IzÔ	:á.AX∂‰I^[ËÈB.?E–ÒHfÚ=πb7%≠å{w	˝õÚ˙7.Ïl3‰¿Gb∆á
r(+9xÀèæXh√|	˜"x>Õà—`»
¯|._IâÖâ.rTDdñ"∏«ñ†d˝!·Çu’ÑGûÅQÄ˙É¢DIó˚3ú9(ﬁˆ:qÊ`éìŒ	òü"
KPˆ=⁄\h“ÃÏm	^êU
Û*0Qƒì+ˇãÏYÀÖ1Ÿ∂œPÉ\¸	Ibπ
y@X UπjFvµ∏¡ßò£.ÒÔ?Ë˝Ï>˜99æy+∞i‹Ω◊˜˛ÒÌ;è>øIìl›?"«Ô›Ó¯õ1çÒJj•—ª>z&n¡‘’ıgÛìyÛÉ¯5fß‡Êf )rS{gD‘U≥ NäbÓÅ”±,qD\¥=@±¢€!ÂÊå´qßÌ˜åaã—yﬂ B®ÃMßÿ{¶b≠Qèƒàüh,ìyb·8ƒ]ß¯ÁÔÓÓÊ#JrË1î´ŸÕâ∂ﬂùñ;—±€ˆ∂c¥wˆsÌ÷ˆ(å†w|≤ûœÂ'7"GÂ©Zµ*ôçÜ’vÕ™—©2"ß”6==^»«ãe<·ÀOçUÛœáåNßÚœèU?¬≈NPø§∂“ò‘∆5}u:_7∑eÕU¿Ãj‘8VB„˛H›áMªÉæyfr°©IA„…∂˜à¸¿O®ü\≥1
∞ƒ-É“6ÕPﬂJ"R:(hZÊÎ+Í8ÆkmëµMÂÇÌ|è^@¡K—p4Rı‘ÊvÖ…ò.ƒã:¨†Ç˚G-≤î∞Ï`M˚≤∞Ç@aI=8/£Iµ‚üÇÉ0Sö¬ˇÛπr,SDIËdF€˛ éé˚yy–Ù
V=Ug∆…ÂŸµπóHfqâ¨Ãœ-≠\ Ñ˛˝⁄Ï Ö±–^$?°su±k5Í≥¿˜[ô,ﬂò`ã'Zì‰_r∂*„≈ÈÒS≈î≥µçCXe »Uv^øZ-”—Ã^⁄˘Yæ÷¶6ﬂ‚Î)íLtj˘Nè‡$ìj1]kW7qÉ)z,sÉxı8≠ TºÕqöÜÜa—&!LÿAgeÁ
·πŒµ¬\\(¡É«la#&øàπwï°,öçÆê+j„YÇW@M
ﬁ“´pb*¢A =´cÄz-¶cîêHD≥πA(·2' ñΩ¬–kG¶Ú¬FB¸êZâºÔÓªUß€¢P"iπÌÜèÊF«÷Û—Dé™ÛÏ(—Ö©éç]ùÃÌ√∂F.:V›;¿Lê}]j$¥%
OñåÑ%≈¡ÄQad\wH‡pò©X•}M€ ®Vî)≥YoÓ’¨Ö˙‚åJ¶ùÃ?_≠¿?êm+ÏœÒgÛ˘<
Ø·ZÚ2iVµ2‘∆òΩ≤+§úﬂèﬁ⁄˜oÖÔDñÉ –Q≈¨mù≤–⁄¬ïπ?NLX 3dÑçÍà&ín¿),ï ÖJe‡)‘º&üBè qM∆e–:πlX-ÊÌ¿\"v≠Œ¡($=DÔá’öÌ‡ôº—B˛ LDªä¬á¯©îÈ∏}∫NÛ≠˚é3¥$íÂÔ4Î.Ω[Å◊ZÌz18neJEowˆ.TËﬁ*÷º2aÒèI≤◊†LE7]˚Û´/Ø--ìKÛ/Æë’ÖÛÁgWf»´Û+,DjÌïïE≤∞xæ¨-≠êIø¥xÈáq8òÉ¿q ∂M¸{5≥6°¨å<WöÒ6Í∂Œ¯ôW[™…Û-»Ù(_∆.’{¶7Öú≤Î2Ë4ŸÕAE/sj#I™RVË,Ù¯QlÃ{JÛ1~§ÒπÙ%Â+Ù4 ≠äâ·©«}Ä¿ç$Î≥Z0ù=nï‚Aen¢öåƒŸÒ,≤†û‡$WêeE£à"a1S¯åV3ë≈∂æÎ¿kP&-Õ¿†—›ŸÜ≥°Ùp¸n⁄‘º•q	èª o2%@–Õˇ„ qÄV„'“ê§#ˆeˆê’•⁄’úQ5PT$ôM<Mr™¶âôí„-ì6LÙ@
‚c/®aüîëy>5h|ÅI(øG8d^ﬂeDæøB$b¢`˜ ò^;'yvﬂÓ:UÏ≠(Ï&Ñªjí„°,ˇ  ˇˇ‰Ω}s«µ'¸ˇ~ä-á`DÄx!¿ó•¢HH‚Üo†¨xπ,jI¨ .IÛ≤ Nî¨Ø≠\€âÀYŸQjÌ;◊©ï'Wﬁ'y∂j?J˛¿⁄|ÑÌ”›3”=”›” !_{âmb0”›”}˙Ùy˝ùÁ9W≠É~Ê ≈lòÈcû<óÔ∞ÁJï>§J¥V:.§≠I⁄Îéƒ1›@(ÒYo{N
tÍSòIW3Ö-yIUE=÷_!U‰Ö¿˚u∏éµÎ·‡òÁ-øˇÛ2TÇP+5˜:>Ê€‡<"œGåâ|ÉπÄ°‰3„ôôÃxÆ ≠ΩÓc•Vi;Â}Î.;ËGxSÕ&â ‰˛Õ$±Eáﬁ◊P>∫¿øRî1¯°»‹¡úL‚¡∏(NÔ⁄D^ú∞ "èá\0aY‡¡4¥i3ìJg∂F¢˘≥⁄A∞∞QY$©rºM)nÑM]PGÕ‘ûü∏|a-‡£ÀEã†*êRì…€X´_†9j®ºÔTÓZ˜l©æOˆ•“Ì»∫√í%ÙtA≤-U—‘%âTòñãã
˘“∑••ézm–Ä‘ƒΩıc3Î◊≈5R"5≈B·≤RÌÄ„uÉAπ˘U®¶√†,'ÚlÆY>‚óBõŸb`Ω/úS,πzÚm÷áX
P8B†$$yßÓhjd˝ı—ßh-î÷ e¥∏∂≤¥:ø±¥∂ä‰…S±ÿ™≤ﬂ∞Qö¢π©‰5i¿⁄d˜…ggø¸uﬂ˙†˜Ê#‘{Û˜ΩèﬁFœæ¸ÏÏ¡É$àçnK∞€±ö∂s‡{Û¬∞R{ugˆXÿí®JqaÔpÇ∏ﬂ±Í®X!∂/û€ÃÃ¶—uP}®’‰YÈõN›F/9m<±É∞“ÎÎ6ñ¢û£Q0åF3«(ÙÀ1ËﬁùëõŒÕ¯=ÆzÂõeíZ¢»ﬂ`ïÑ]≤çQc“ÙˇˆÎÒU,˙Â≤¢Gêûôl¢çµç˘eT\X^Z/ü'C· j U`sÍÛGü 0#£ﬁ˜ÒWÑø˜ﬁ˚	e+‰:∑∆£â á∂›˙ñp·5!ﬂ≥ÓX`û òŒ⁄¿s’?ìÄ˙<0»ﬁM5ù√ƒJ"ˇß ó]F| è¬I(úA¥Mipò°-?.p ™|¢Ämõò˜d†,≠lç,	‚'iƒû,}≤ÔçyôÔñ∏è‰˛E`{iÃˆ‚lü105/òóMâ‹Üw
ÚA.^^¸†Úsx{w∆_ÿÕœÿÈ¨±OaP‚t	Ä∫ÛÄ-»|EúéJ&ÚCéN+¯òËú¢ÖµïkkÜ≈ŸÇ	ÀIÿ3ï†ÿ‹…Ω®ƒƒöp’OÜUkP®Ã_¨&xÌÌ æUl&º*Õ1È˝Â„ÓæÍ}˘UÔ√ßàÍ∑ps~i]«'√Ö•µ‰ﬂV"Û±:I2†ïÓUïò8—æ›¶)áëY¬"¡ˆ¥]&#¡4Bâ˜$Ù#M˘“∏sì,¢-Øâ'¡ã?IœıΩYÊd¡\cJŒ4d+Ø»§8¥j·$
ˇ	-£áaˆﬁÀo¶∑46
	∏≥“È°0Â∞úﬁG∆œ)W?c±sîÃ—¥≥¨‘ï!«¯ÙlmÅu4›4ïW‚öqíßü«)f∞i0x¯eë`Òx®˝H0ﬁ≤?C,9∞…˚lﬁC»ÒZÙgA°ˆ€WOt(ü™?#≠íÒ	£V¬zËMπqBõ“∂+·2èVv∆ºbÓ—b€:‹ÙDe6¸Âh@˚ƒ.	
Œ!¶“%Î_o_Iˇﬂ#Uﬂ¢ö≤#åq>Ì)õF:f!lër[ú4P¿æ	L0„C<@åWs“ÀıbÅ,!0MiC˘¸¡Í¡›¬∆©IÍA¥J7,É‚€nÍ€Æb 7íDF√…®˚Ûè{ø}«ÉAY,Õﬂ^ZΩÅVñóãhaæ¥(K#o™ìÈ")ê^≤ºê«A¡D"˝ÇiÁPƒVc‰zôIJI”ìBXuæÒÈJPª@wﬂZìË∆q7ˆì‰5ÕíÅ‰|J˝†*±Iu,®P5`Mä"T
©ù;ö˚±Q(_*∫s1ºî)íy}äOˆÏŒ*∏aÍµWÏ*+‹ë›>v:vGÁÂWu∞m7˚Í„€'Ë«áßà:p≤~%,`aÌå\k„]Í]ãÀeûÙ‹ﬂôlêüÂq’ZÌZUÚ_ﬂâ
˘ıQXÄ,˜WˆÀu ≠¢ÆSﬂñ≈'R≠˝ N´®∏/ÉÄ¸	~9¡UŒ‚?w,œÑΩ¬ø`“‹d.Dá∑b≠Éx7¥àá"∫ïï¢*MÄ_.⁄VgDü
1å.ø(6b»À»áöp`àƒÕ(‘ØÃ(IM∏IP∑p“√¨ôLg˝Ü‘®6ﬂl‚◊ÆÄw-@4®úÂ}í;¶îÊ∏Nà2Ó5≤hu,U<[C⁄˘ˇT[y7$π„Å€ŒE{J˘?™Ÿ/kal$ &»Ø∫6¿/JßÜÕå¨©»M∫±∞C0\kªª≤∆¯ﬂ’Ì(√L∆N£HﬂÙPE!èe’÷Z∑€µÜÀ][-` ∂QÇÆƒ¬Uy>˙âçÙ÷˘6^S’í¿kX,yrD8D4˘`tƒ`¶+√GÓÃ0i5!'2ÉÜZœÖO$¨B{7‚Bº∫T Œ)∞?p!79û≈Ï$KRÀrÄØ”8·?)ÁC„‚⁄V»∞Qí∞
∞û~Äå„∏˚ir¯m|wqwÀ¿1ljöˆL·±JYò¨A\ó÷«H?¡∞·Ãﬂ'‘Úìúˆ•Ä6ñûìÌZ´Uè£€»|n€’Q>‚Ö≈÷xUºXhÑ<÷*d®à'‡˘lµCÇççóF¡B(Ÿ8Ço∫…òœLÕåüg2®[RH ·@Çï…‡ıòŒ„)ôb#—nÛò¿«X´,˝»úkôqMπßG‚_#Óπ,¸+Õ˚◊ õ&C˛è7nL´™¨‚∑cY4üµÉN$ç&¸ÈcÛ˚XLÁ\ú$øì≥Å¡GV‘äSÎ„òT≈ıÀ ¸ÿºDß0kZΩ∑ÉZ≈É∑Æﬂµ| Ù‡}Ë7$JêèÈ÷ú®j2˝DèBaÂ._ØÉ√â∆?OäHaﬁ1±C’(RòaW˛J^^ƒ‘Y∑;Ææ;ñ0`o‹ ^.∑¨ˆ›∫˝\˚„VYRÚÒ<]∆˜˝ªÙ°·qä¡‘‰,ÇaPÒt’\ßâñ!•èî∫_'âj!7ãV, Æµ+X•æ˛CaÏ≤{o/.ñ*3ùﬁB"ê6ï¡ÀhU{◊’O‘«Éπ¯	Ão›{qÚﬁ”: Ãç§_A«ÏøGŸπŒ¡WºøÙ;2&õrvwÒ€“&‡¬î®ôaaÙ⁄=ßM©ôò¨Çp≥˘pªπÈùÍÓt®›Lü≠“˜‰õ•—}˜ÚÑ8€⁄{ôQIXêx’Ò‹œç$≥dÍΩ?k’Œ>Ë$|Ÿ∑·vˆ-Ê=wÌ÷ÅÎ÷¨Ê5|\‚˜©.⁄˜j‰åü…ç†∂Ì‘q[pò∆œ⁄.ÿ8ZéK%peÁ†]jÌ◊*#¯R÷k…iŸmH7ùbéù6:⁄ÌØ•sŒ Ä7o.π¡¬TdW≥}qeûb±R2˙mUñ®Ö¸á"nZ„?∞ÖÊ{<§°*<h·GÓ\<I$,Ù" ç°KÑ5ÜæèrπT.ó;}ÒéA#«¨ë´≥ü¬¨ƒi„Ê&mÆ‚è©2¯ò*í1U`ÓpìÎ6Ò^‚M∫&¯è‚ÁÚçß∏”¿ëd%/û úﬁQZ(˝«aΩcÓA¿vO¨#˝ëüc∏Ô8˛>Ã∂O*&Ì¡}Ìπù∂só¿Õ‚ÈæäF^Hv
’IoÙÇ]ôúûô1mÂ6ebìÒïZË˝∞e+VknÑ(ÒO©$?ô~&-âbÛ˜∆3”ŸÒl&Ø¬'ÜW˛_F ¯'”µckµüX¥≤¥€>Û&—7J# z$2;ﬁ∏3rbOwÉ≤$BßıÁdmÁ?cY<ÖeävÕv`[∑:7±@DwåûTõn∏Sπ”G’Z€›2<≠ËcòùÆÄo&·7£.˜l…9ƒœr|ùµÃ›®,v–/}
ü0Òeÿi¬û‰9Ê⁄ÄWêµapà¿D~ìÃ›Ê[|/ÇâƒÄ÷QgØC◊ ô—°⁄.ÈìU/LR:¸+(=¥¬&3©üLÑl`ê|ì÷$ÃÍeîç6y	≈0“dñ•¢…~Gô„F©xÒåvıË<≤ß.Cl=õX+ãyíí~6B¯¨Ω8¬Áö†§œûã!}ü¯≥åpŸÛ˝øO˛\+êø°≈…Qîi%˜ÎXà¢´täˇ¢Ø·µ%ˇ1ìØLXzƒe‚è:z»›	«ÏQ÷®M|Á±—ùﬁQ`®/DuÙ±¯”-t˙ÃüË˜E,&"<ZP`ç™4≈>+x˝ﬂK∆BXà≤ÊOpbXÂû'≈âb”%„ÖpΩ8¶»@$D\ª<·ﬁSˆzBÄMJ!8©4°ƒ°|rL+eòÈºq^,ñcÄ˚å£[nyiÃí]Ø£ÁP!÷1ÌD©ÇzÖê§löCgÁ*F øYÌÖ™Ωk‘;zRç•“XœºP€
,Ïm7âôﬁdHÇ[SÍ“3Ãµ÷ÿ3aÌ 1Œª¯næ˜WÜmœ©W)p∑	ˇ≥¿DIÉÛÌ ›>πãhpwà&ï¨¿z3:îCáÜs¬¯b“édü8lÌ¥ŒæPiNá4</\KÕÆıã6‰’®PÅÙçM÷RÎ…	>±ta–NÏ-:ˆÆ¸ÖŸ{Tﬂ &~5E¿6óÙÖ*ê]E¥fL;WM›=Ì§’v*6ﬁ?¥ˆ√ußΩ Ltëì√+ºv5%ﬁ¶n‘‡à= Ãÿøºº_&f}ùÊäs‡⁄≈&âK‰[	ÆC{ÊM-€÷=€+x\ÅFÜ’úu¿ÈZˇ∂'^(™/rÜqJÄH¿Œ<‚â‹ÙCõg˝¸«\ï¶πBaÕ√ZΩû¨‡9›≥g˝[«ô‡CS&¥pqﬁ'\ëˆ(ÍÍí,ûæ°ﬂhD¯\;ÛE#c!r≠ÑÃÿ7ìöNf€949W∏ƒ–Yåe|L«&?z<9Ô„	å{Œ÷ì¿UF©WJÆ1Ù•h}<ÕD…4,§dRcï‹Â¶w>0,ÇHÿÁ–9ıﬁ|7ÂîTﬂ3∏æP∑j£Wïæ¨∞JíÎ·oÌã
¡´√xS	˝T±áYË1_x…J≤;ùz≠*^Ú_ŒØ]Ëøb∂o⁄åc*,·ëhHm´Ân‚e‹íÑ˘Q~”¨ä´wƒ•∑fcYêæ◊ Úã∆zä˝yU˙Ôl∏¸åèΩÚ	”nÿm´^ıh”˚
kN◊(¯°¢YBûô|Œ »OÛzV≠d[Æ°´)2±°2ZëB…#ÜxÆP48®6úin€ß—∞·Ä§ï√W&∏ö™pon_˝î~tÎHv\ég0íÑõi)Éâıbû'‡n‚˚¨∆S” ª~œÇeÉ¿7¥aµ±÷ÁL9M¥V©¥jò%ïÎNGÉAZ~~õ$÷T_?@Z‹⁄†˙ÑØ∂ey=ﬁD›ñfBnN© b(π4)±ÕoûÈ4-¥.ñÈ’ó»ˆÀhiÖr$®ﬁ„∑{è{ÂS◊n≠/5¶˛€«@∆zw≈ÍÇÍA6nFœÖÏ,z)BÕ|˛·>‘<#$E≈Wè„È˙9rˇ!∂ õ¬ñ1≈<â’a2èˆìyU∏ˆ\cÒ˛±{ì75«ºëAˆ±ˇÇ¥doX9/KÉ¡YÌ>ÓAjkÄŸ'Ä!âVqa;‘múcánvü<È}˝pãl–ÕıÂ˘Ö‚÷7º?µÉˆ¸&ßf—¢•†rÀ:l¢kVuôñÖ!Û≠hÆ}á∑TV¢√≥ŸhôlNaÉ·£·R”™\ûsl•i˝VÚ†⁄Öùƒücyu‚ef˛F2áÂ‚?õ˚ıÔ>@ó·]^-À°Ö7˝∆∑E>œÇ÷©V;ú]a¨=á7G({B∂?|5X¿UÔçà˛¸6ØÙ∑5¸L€soåüˇoTﬁòﬂ¯VÓå)º3Jp‹ëï&J»pvG7J⁄Ñ&˝ÕÒ›|Çîlx∂é>1Ûı˘ÌR†bê-¿ﬁÈ¸;‡›O–•*Õﬂ(~7@KLÎIy*úÏMÎv=¿&høE⁄#Õ	G√¿‘O¿Y}'ßBœ¶Ä'ÉQ¯	7dÇ2Ï⁄fæáA…2§∏ô∞Øñó¯ßî‘ÎG#˙g1e>¯ü®˜¯Ω≥ﬁEó2Ò¥iJù‘”p¡ÿ}3Œff¡Üô<ø¯ë¡ÃÆEÊÒØˇ€ˇ~˙ÍæıìgOü†‰–gîˇ!¯ª8í≤Íà§Hq%\Õœ?€kÉ¿íQkyˇ[ﬂ¿ô*√+Å
û&¡.B≠∂$¶«?bÕ…H˙∆Dy>Ñ∫∑^ìîË"È⁄®ûá*]Dƒ ”Ø|z˜§ƒÇõï¬5‰‡‡T£r∆éo∑∆∞E˘:«ltN‹∂°ÒyG¢rx¸±~ﬁ—÷ö’Q¿Tﬁa’∏ŸÂM=Ù:∂U'√^ÄÁ§ ó»@ÆO~<ìù¬[‘≠∏∑∞≠vg?xò3^à·=‘‡Z¡[Lß«ßs„√xá˝¨“#tÔ{”‘¬Án…iÈÊx”Ò0(6ØU»<}3¨‚ùì‹=®Ïª5ÀslFÄt¥¿aÅúwúv}7‰^€∂õ‹ÜÛH≥ L$ΩKKÆ`jôôb®DÁaı–jsc|•÷¨$yooq0â‰˝fr„‰ülv#l@ËœUŸ˛&“C›	&ë›¢Á\ìò≥fJcêmg«ÈpÜÃ[¿òË¥äÜ‹¢gKÈ4!ﬁ7πaÏÈ*÷OnS1iJòƒië˜{NıfÒÙÕåOı1É¸¸¬—Yé~&(G¸”±¡&È!±Âeö4≈©µ<π0∆?û >m–»Ù'H º@ox÷®\:™â"KPÃ‚·<‚˙•B!E÷-–KüΩ&ŒyÚè—˘¿˜j∆Âq’°çÕÙ<ß£[òE(ª≠!= áµbÏ®ÜæoπPÁLŸ/—√Í’;Ä	˛À]b≠Ï7®4îÆ…ô
˝.€÷Æ¶[zê´WvNBø7≠FC;—Ñ€´cˇ¯ÉÆoÏ;nG”3;˜Ü’7;’†ÁkéÆ_ ´á6◊Ï§Ç~ÉíæR&GT?›Íπ¡Aqª›Üù|Õi∏h√qÍùZãY…ú&∫I2‚‘d“i\]ë)M]Ä	Ç"çﬁ—í¶ÅƒIÇÁ]Õ»q9ï8ûP∆+Í8√ﬁáJ™Ú	&%˘zB™åã∆?z§©9®≥⁄0RÛŒE¡•:Œ-§/XÆù;EΩü˛¨wˇ_¨ﬂ.i∫˘œ¨a€¨Qc"=˜Mˆüe˜∞í≠zÂ†NÎ Æ∑Ì{5;(uë†®YiF.kï¶]˚q(¿MÁ‚[ì∂'¡d<≥ì
ä*^“Ω‡}œõnÜI·n3ìVZ2aWDìlTÖ 
]¸ﬁ¯ÎØ~°r$8Å≠üwd∫-≠Ápß˚ﬂüvˇ˘ÛÓæzˆÙ…,∫(Ô‰™˙ı˛«oz_>ºp∂ƒz©¯“RÒˆ,)@Ö.©ª3f2¥YE©	Ø¿âUAœûº⁄}„±BV¥µ%8äN¥ò,Í±ºO*ü°	º°ú˝⁄·ƒ‹¶ZDS”[j(ÅbCpDnf&”[Œ≠`{‚±<0L>ó§?Á•ÁZ‰äbJ≥’¢˘Ú}tS’öMM1n~h_uﬂ˜©P}ÚúÔìÎ7v`CÊ◊îîóÎÄÎFº˘√-Eå#˚Óü^«îä§¸∆‹ä°mçEﬂ˙A’vI"÷–».´`€ÉŸ Åà
îÙ‰dî˝ã4¡çO(ùùKõ—â!ñ0˝HÖ„zÈGä$<e:582ò~∏ÈÚÛÕ^ÅönöÖ@ﬁdµæ√r%¸++$˛òàöóÀá∏cœÚíôV)Ú—(£µÌÀäh[A8w0EÉÖ(®Ç>i°¶≥è¢ﬁ√◊{?~çr~oÃón7@Õùf@ØﬁΩ√vÁóÿπGÚRüƒÊNŒHÜJlNK,„ÎcsX√M¸»*∫ë}ÆØÈ&~L8ı 	q{÷ÄûË⁄íueE‹ú›fÅJy£@%sJ6 “Rê04jÂ¿owˆ”wdªÃ¸øµ]|¯yı~˛6ÊÍﬂvçœó}õ]‹∆â+‹È6¡qˇ–aüﬂHJ'∆≠O‚ª∫ó«¿éê0 9Ñèá›;_–;Õ7…zÄª†+ Írßç{#ù^%u–gU/⁄&˜¡⁄çåòv«Pâ%}¡/$iljá@:b[7Ñ⁄ÉO:Ù∏”°;'yë`{ÿ,·£´!›/˜Öè∫∫4∫˚„√—ßÕõ∂"„ËZõ#)ó4 áèô0?H$˝åDÌûPAî´å0Âõy>oÈlTg%Uhk´^´ âuÉT«VDÙ∆ÁÕ{Ö⁄´{TíÔΩ¿:ŒãO@™ôÒäª”37q7uos@?Zv8∑$ì’ó…¿„Ωº–:–ﬂπ'XãÜ:f~72¢N¬„Ñ5à+Ïk⁄∆‡T««qz.∞¨f&'—>)‘!a#AÑJ`v‹ÈÉlåGO-f$_-*¯‚`ıß7«‡¬Át,arSV=>‘¯ûU?†ﬁ%®⁄¿ÙΩoé—Ø∂`bUÃZcBã	œ‡ó|´†$è“4Ã¸rŸ∂⁄ï}çdŒn‚eÛF’H˛ÓWÓK|F®9=“rZÀ÷±s–â}ﬂ„ÃÅ˛§*À\<°êkU39Üìbå6n ◊åõ=»∑˜k¿Ìg»3Ü……^F˜Õ‚√ƒÌ`˘∂bä–URâ.YGˇ?xÇ f‘+$≠heá6qBµª~¶é/çóNe∞ÙÿÁ\⁄¿Q¯—úö0¯Ùi¬á√<¬3G∆ÒπY¬ä◊<)åC–iH-Õ]L“r9#ÚÉ—)G4O:0ì Ò›sdüüö=Psóù ]?ÍóÒCkMﬂ¡û2|h—F¸–5¨UŸV3Q• DÇ¢K
] ¯ﬁ)Ò…pà3ÜLE◊ûC0Í-Ω©¸œ 08y†ÆéÖOgïmR≤V¯=µoŒƒ“›|∞÷∆=ípZ]ó‚bü‰7ÆSCÌ¿lEIu=Ç”9«JÌ¬áf-à`üs'RåP√¡Ñ™à–ö›¸B¨fç·È*∑Ï 
à'‹√°‡A≥‹¥9YlïÈ÷# ¡s'ªªLû1÷AöΩ^w,bôßU	‰%_êLÂ¢;Ëß_$….å‚˙çsÔ¸^˚4¡á
Ux·Õîº(Ç±¨E?ªQñ3—Lôöh‡£±e9€9yÕ[ïôê†…\a˚|‘ıv”}◊€Â?*ÊÇjuπòÄ:ô°éhÛÕF·Tﬁ#7l‚ÇﬂÃ"ÙT˘‡æÔºÉ >îddÏÆCqC|∂ı—bÜ.Ω+úåòÃM
Ë>!)q&æ ô¯a∆àèÊ≠^ulÔ|Â˚æ:7∂ôZœX†ƒ)£Å˜0åuÚ[ÎÀ~£Wä1è»?píP{ÃOÒ÷ÿ!¡Âf'∆â∫˘ãñeh÷ıœÈAòh∆¸Ï–á·ÇÒ8I˛Ûâ)7HW8ÇÙÌwî9≤3fh>L∞$[πL¨ïÜ—x}o†|¨uùËfŒå‚ç|F‰F<ü;µ:>Ö84BC !ˆã=mæ‰}Á∑˚ƒƒê@(5“
BêSï9yÙqbsòÍ¯õp}Ìv±¥}mm≠º1 Ç¿hí ”˛Ì‚¸ä´^”,µ™0î¶K≈•’Îk•Ö¢◊:Õ† •ÒÚÕ•‚Ú‚(ot“ÑÃ//∂éI’í>öÂl¸#hb≠/Òõ˜oÏ‘0´ûìF›	ÔUµ›Jª÷Ç}∂}◊¡ß∏ÚWªi÷∑±ì*f~/_'¶]ÊãíDE3∏≠L'_µá»êN#A*CÍ9‚ä”5k ﬂ˚ì+åŸ|Ä—r≠Ò¿8>4\°È¥EX¿sæäˇ∂Íxr™¨Rd$÷ùD?P°Ím-TH—‰È>¢‡3\Gd∆\ö¡éôÜπ›
˘K"¢Àx,4O ù˚aw|{>cÅÁkçÊpã∫œ˘Z§ô◊¥≈ $eˆT<gò&É7«ÅêGÒÃπöÙB¸√∑pÆÊp‹ …J>ﬂÚP∏Eàc6‰?‡|T√·\xpˇoÌKåDåÂs≠ˆD≤µ√xôÃπè•HWràáÁ—Â!ÃÜÁ—e¯ÖÁ—ôp·yÙ§Yx}…PûG?*ÖÁ—ó:·yt&≈Jx.3(EGJO∆&
É∏"¯@lë©îÀ∞IgfQπn€w†°ß›ƒ$¬$P4øªæÇc¥n‘ÕöV†™%\2Àb“è‘L‰D¿L3[F~K@©ÙQk#∏ñ°Û 	,ú(;ù áReπ“Ù•ëï›ÿDfÄ)4J†q/eM
	ƒ5ò£rzH≠z'4˙‡wˇ˚È[√i◊?†Hª_úª—¬º*Ô&I}ã˜∆ ;¸±ﬂŸƒ„6tÎ”ÿŸèbmVÒélPÍ«¥≠Œ±ÊŒÔZZ%.¶u5»˝F/ÛÇ}πb:TÚdUmje{Ú$WÅs/À?ÿX[G••77Pyi±xmæ4ã^*ñ6ñÊóQya≠Tº∂6_ZDâ˙ﬁ,Qì◊Vó_é∫∆O.Ï·©:a—¯oıp	,µÊûÀ ÃqYdØ7#Ïwø]kﬁı ◊•H$)Ü˛Æ∆úÑ9¬ÑdS¸;ÀŒ))ù?JÍ∆gJoæêMg™ôÍñœÕ…@®}\<)6©/ü˜˛Å≥±-æñßî±sS”n£r≈i´LM˙—G<≤p™µh•bÆjõ¯gZ[Oq˛Ù[ãKAq£‡$›<l◊¿ßòÑê’YLxùZ≈™'ÎÌ-—=ÌvFÆlWã+/oÈºç—
FShˇ#æ+)Ω=ô…f≤[≤ü¢êãf¯ÑnCZÎK¿œPû·*‚UÍ($4‡¶¨f™$·ä\¿ﬂá¬Mê4™ò0î⁄=`F}LnÚÿuVI2ëµ…·µŸÃ …xQ‹äÿiÓCf…\œg◊p8D˙}√n‘Ôúsí(Î„úD`çL[^>G™ÙZü‰znÓ¬Ω\_¸ÂÂµ[Ó¢ØÙ≤‰b¬à?π≥?\æ4ã6ÊËÅΩºv%nCÊhπVH¥÷¨?ˇ”:{TüçÑY˝¡ltdÑCﬁŒvÔbçAÏé’FÀŒû—aÆZÑ«Çˇ;âd¬\#óÖh)≈Üõã ÇqA4uwßHëÉöÔuàûR$ )»w√n7jM´Œ9∑Åç4¥∆[˘mºÚ}†ú≥QŒµ˘Bz73ïµ∂ ›E¸√
®«r ‰K‚Pô»§ÉÂåFƒÂÄ¥ ıE¡>£Û[>&4Ñ®“{»2m¸3ç≈M∫ï∂SØı¯¡Ptë#ël?ºëF°Í¸Vâ˝)&W7’∞ZâD›Ÿ#Æ<ΩbcûA4‹(Ñi∆‹™Õ$IÒ·àä Ã##d¢~KCpË9xÛrêauõÄ∞QD-~™Q∑òTÕ≠•¬‹ÓlÜê≈{⁄DXzœ˜ñOå ±œÆ‹c3âP‡âÿYê7Ê˜ÁU‘ÀπH?ÕåÄOØM{Ê)æ;ª[{ClÓôå—≥Õåcö·òÍÍ:5=Ãç‡8ù d©·Åjk«Ó¬˘Ï…æ9~rZbŒÎ"¨ˇ•‘d*Syô$ÇÄ-V@…eÓs¶Œ/Ï»„ˇruDg–˜PÆêôEk+Î¯@Dô‰Ú“jë™Ú¯∑ôdiÌ÷Í"Z..¢ï•Ö“ZrqmÉîπªUF◊ÊK(qçD`	Öt€UQfH^Rk$ZK,Òßa·õI’£∆,˝ªQ“¸É-+ßÏki%!Ì?$ÅçîRãú˝2˘%Vëäá'¶ìT>,áGh^!·S)ç„_‰Yç`iL˘—Xx(.$Ëq”·Yfø1∂ñŸØ~‰∂-yÿjíÏçe¯Ÿ∞lxØ‘∞ﬁ∏q;@’.∫Dø-ÄG”Jm‘¿›w	o$ÚŸG5,U%ee‡ç◊:∫∂Ò@#2AºJ<‚Å«Wï~†¨"Úë=zpÀÖßê©tÑ,§–L33„ôtv<;ôOß&ÂQ¸\¢Äÿü_˛√ÎÕK∑"z8â¢…”ª/_âqb*ìË!ﬁo·≠YB∑J´Ô–Ë8T˛ ‹-á¨!È÷∑¢Ò8¨Ob‘u›I2‘yÇ1/€"Âó∞˛≈Á≥Y˙ÿeôÑ+-´6Rr,˛.0w∆øDÑy©p¥@ﬁ¨lWúf’EóÁP^*\âq&Bå°:Ä"⁄™ê…íñe≤Tô,≥¢X+û}S‹&+’D€ëHéö∞ﬂ;›}⁄˚Utvˇ+‘{Û—≥'˜[;<UßΩØ^'p⁄ÑP‡È]nƒ-'ëùB’Gi≈í?^¯}ÚoÉFjåëõ>‹{{!´ﬂrí°∑@ _séÊF“XÃ¬ˇUñå
¡bVH°‹BF©_Téuø∂ÁF¶Ÿ°¯u∑VØœçËPö‹N€πã_ÒÖ\n2ìW6Doª]´vˆÁF≤™U∆ôo˚€GëÏlÿ≈/ÏNÊvÛrIvåºP»
ª≤Û¬n~∆NÔå®/≥9ÙÓ[¥0h∑≠„πì…©T&´oÓvvw]ª√nGﬂGâJFy÷π¥b±J=ë6‚V¸Ò6Ü™\%Ó‘QTÍ»§1;Ç–d7iµ˚† ,¿›€3T¢¢¢,¡Ä‡—02˘∏ú±√ÚJQ>Ñ1Ys±jÃà<nR¬Á$/#Àï.UˆÚXÕ+ã‚¢muˆI⁄v•Ó‡◊T≈ÿü‘\˙y ∏_‘óZ@y§ZAÄ>â˙	 !›+>—mì‘åX{©XZX^[¯‘'â≤ïœo¥¬ÖÁV.‚' ˚Œ°Kÿ`ın0aw≥[á d≤a’‡#¨Ω+x5ÁÇò˜(Y3-B-I§Çàb<‚ùÛwJ§tÓz€Ÿ√™ñG5—≤R¯ïq_â
Xq+>XÁòó?81CA|äK∑mÉòÇaú¬l*s;ËI¢ÈÕ0Ö´),_¬7éÀ√ELŒ»£VMÒXL“ŸJk±HCHçÚck0:2DË»Ñs—UÑ9ùM◊üIA9õ)]ìR•kÇ.  ô…ƒXWH®/ +;‡⁄>⁄‹)R„^móUm
9Ew$ã9íû<°˚TÜµV$ÕŒpLCﬁ«Ütú!™5Àjg*´òü◊îòah¥“ø‘Q/ëÂ]N	qIa1s)‘˝—W®˚≥/&Œ|äz_ÎΩˇ{î ˘¸ÙÁΩøÍΩˇ6Í˛ˆ£ﬁüû†ﬁˇ˜’ŸÉœŒﬁxäzøy“{¸,êÖ˜ª¨UÒäë›ö‹∑ö’$ffê`sbìÇìåÏS? [h∑1÷Q 6ı¿P=}…˜2g]ımZ~€∏ifûÂ›§‰T*∑Í~≈Úƒ;;ì€Å™£„Ñáµ¨6æﬂÒÓﬂ‹Òk∂'¡ú1K ≥¬øº»‚[8Jz∫ó¨‘k≠dÀ™í“Dº6(ÖÓ´ycî‚P&m‡\2S&ÿÄ)ñ&áØ	øe”ã [^îòÁÛS≥ûmòŸÀıZ≠`°áxn—Üµá/±qö¯ó®hˇ=/`P¬ùCT(Ã¢õò4&mº!âÈ∑ï˙¥A‹¬ùE4-=K-›Òé∞∞ÅåπX®<ôhÃ¶G¶∑a10u*Ï¢ûó›Uõ≠¡*Èg¨!ÁE· ¬=5Ü¯h+ÌÉfú+‘·±9ïf¡æg≤≥£ë_WNÏ›]õ ôAZœ’TµÊ°C{§˙´¯kì]≈CíW[íøôü·6rÂ˝´Ú±+ÎË$Qa˘ÏÍÜ”±ÍÎŒ!ûx‹'®Ñc©é≥Ï¿…_Ó‡≠∫óì‚ƒm∫DﬁÑï‹≈€Ü÷√°(ú,6'^14|ı£æ3rÂoø˛›0F≥∑Å£DÌËÉüw:',gÇ|nÑ˛ñzúÊBΩVπ;wB≥•]ª≥‰N«^q™V}≠e7 ıfxn=§@d˝jó¡.ÃZ≤3∏ñÅx"Æ[UêÇ<;É(ﬂ,ï
°®í(ˆ≤™ilg®Knxf4∂À—gOﬁ∆«Ÿ;èŒﬁG›?|ÖÛgOüêrAek@dC)R)¿œ?◊H)Wt˝ì˛XWr˘ÑÆπDD·Æê¢+Ï``'úp¯\r~‡U †/®‰kßÍs√\Á´_ÖÌÀ˝1p€ñ)¨T˙Á9˙∞∏vÂÿjFxvX{ó⁄¬{?}‰¿ã'T¥Ä˘ÁÍJ8\õïﬁq'¨@¿ã'Ãü
“∞˙ÕèﬁÌΩˇ9~â´≥è˙£DzÂQ%føLL¯6á)B‹åç˘”‘:˚\zàùÊêÙﬁiz∑Ïà¨P¿¬h„à
‰™ÌÉ%s/ì‹ô¿HÈ¨.ﬁœì€≈ê>ÿCìX∫;®Ïc·∏ô<BbªÜ(»eÅl6,˜n≤Hõ≥‘<àÌgõHáºÃ>N®e;S¿¢<˝Œ¯>–_L¬≈1˛Ê±-¡,!||Ñc´'d∫´›Å˜’;·;tâS—
Òk®çp‚75GazRõ£<K_úgŒ§˙å§†ã◊Vô¶A—5äJ√ë8·¶C_Ü,]x%1_y „ë_C"Ë•uFF.ŒÏ∏?6â—ƒiÆS~ºË6≈F`!†!Óö√™iÂVkÓD˙Ù≠ñÊ©e€∫gÚ‡‡Ï÷˚x2Æv◊A‹î∆èÍa–ı0Ê¯:G\W%TLŒÜ"‹ûI•ß!‘@$vr=áØg∆"ÌH∆Ø-P3MëF°íN —…pƒe-´PF”
¸S,ê‚≈ñ©òÃËt¡Î√Ëå',É i4@5û´≈◊6MÕHáÍ_·ﬁ·ñßÊßE›∞0Õ*⁄∞Ô”DU¨Ô˘ﬂ…Ôñ€Çc`3?1µ™â-»O[è|¢±™Ë\tÒÊa≠^OVä,Y¨]ß›gÑ∞%5Os”	(’Ø$e°∂N ±5ä4´»rèã.◊’~R≈z´1zïè('∫˙1≤‚Ó~›πÊ4ä&nhR5d¶‚êÓ◊%í´‰¶∆gf∆≥π<≥Ì√™Ü¢\KI…Mı•‚¬⁄ Jqu±∏(uÎÇ§%ßäÌƒUcŸLfYûoúÙ£M#!ôŸπ¢p[ÀFÖ5∫†ƒ†∫„ık#ª¿	$Õ:T§PÓ%J*}s>ΩO|m(∞ıJRûáb{lÚﬁ(iîµdv¢F]©Öò¬
\ö.ps¢∏ﬂ[ÖπÅ'[∆‹É°:¢pœDêÛ∑0°è8Ô{ˇ
„ô‰\ßY5LIkc“©È∑Ä ∞Îp∏é5¿4¡óÏÅ84¸˘®ŸÅ‡Ò=}ö$	Y$æÖÛ-8Ìé’¥†∫'´/mÔ‚
©!ï8˚‡›Óg_°ﬁùΩ˜∞˚Êß‡/ÍΩÒÒŸküwÛ1æöˆŸÔı>| ªãLÕc-ÓÒØâaìùﬁ§
H“™yÅ.¡àÈ∆iØyN{mt—‘ÍE°:ëíp|Å⁄⁄If≤:Øí4Of˚T[>£vOŒ`≥~Û†öhµÌ{À¯#ƒF∏Ø5AÔM*•’CQ`˙Ú-£A≤Å“œ‡'πp's»âô-ß¡	¡BV“∞Uƒ©‘J{y˜Ï«ØvÙπ˜¯~Ôı«ËÊ≠E‘{¶Ω«Ôxv”goS$G˜¯>Å◊ÖåS\¸r.ø¨9.À¨≠'Æ∞¸Êp%§/∏â˛˙À/ëÚ5…˚°-ÚÜÙ÷ÖµÂÂ˘ırˇQ⁄ò_ùgoäÔâÍH≥öNˇ,Ì¥˚ß˚Ω˚ˆû¸%Tº Ãü˘1¯Ÿœ0òDy°Ñ«â◊nØ¬ëÖ®ÌÀ35õSƒó:c4B∑B‡ﬁ∑AËâWêyÅ€{f8÷®©f™ÌI≠pfıJõœI;òqÑ≤√g©<Ì÷∂/ﬁ∫˛nZ√û §√‚ö‰ÄÎS¢‰[*W`ˆÕπ¥4,(ãE˚h:t$¿@öÙå5Úwãµ¿d'•¡}íKD,vÍŒ^€j†ÌZ’/VcX©°(ìM!Ä!l	•Â,¶«°¢Ea<=v)ü~qú\ƒB¸œ\?9ìÆ⁄{„—˘KOé	∞o|dæeå∆S–®àt˙E°/@t˛≤E?/urRí^b>≠ÀX˜ú∏	Ê$/—ÕµÂµ•˘4ˇ“¸∆|©Xê»IöÛıGXøÊiö˚&£N¸ÇXò»£8ªª’&$ l!ª∞dó9êl‰LøÂƒ‡ÖI˝aØê≥yr»ç…°ºÂ)AÍ∏ÌäG∏{ F(¡75Ç «x’)ÿ7•π≥(W–&∂´∏‚Ù8ﬁ¸-€¬4¥‘§á~Òı≠kV∑G=©S®îöËIëèë5Ç
›*+e:w…'jD=üŸÀ¯—|¡î’#≥óK∞<|ä™ÂÓcmëÕeZôπ†úK¶	Ÿh˛û’±⁄h≥¶·RÆÚﬂlªâ%ÑL
f9≥•ì›qé d´‚GHb»ÁHñá82éhÊO^z√îÉ∫Ö-ı¿ °l*Ø°!¯œR3Æ ó ¬`æªœõº@?Ô`Kvúdßçv€Xù‰DÓ’,>Ù	ﬂ‰±…¥‘íJ~PQù&π?–-≤™¬B’a1ÌTû3¶!ÄJìÒ^rjº/<@Õ„G4ëòk]içÛ±ˇ…${[t≤!û%4”TF’)∞◊ ‹nÛdÊÕ…q¬∑&∑0IiÑe)YVÒ:ﬂ<,“‘y˙”÷Öép*ˆûk¿9ÌÄsC0Ã‰yg8;¨÷Åçi~“lÉÀ˚ìíÓåeäg)Ç%d‰
YSÛKó'ˆ'ï}µ`hboÅ	πF|ìÀH 6U~πºMEÂÀ≠>ÁFû‡RRÛΩ∫Õ§Ú€K´hΩ¥vm˛⁄“Ú“∆À}à·dRkípQ?**b·‡ﬁaJËÜí8Px¬I›ñÇJ®}Zç)∆Ç?†pàî9L◊àK&L√¶á	$&F¶˙oÔT∑kÕm¸ÕGûaIôÏ¢G¿âæ∏ò-œEbã.ûLZ·'ÙÉÔGÆú‡qÆ∑ùVÈÙE-Ê®ûHl+BNõ ¢Ï˚ä¶ÑT≥Q8∂Vrì∏ÓÿÿkÕ¶Râ4M9≥÷!d¸Œ¢—|˙E©Q ˚p‹ü=rÁbdÔ n˚RYM’Ú:Qm*|(J£`™«/Î∂¿≠áÈˆÙnìdN„C™j5Z¯¨Óh
÷™Ú»5"·Ï”ŒÓa®ÅåyÑâïPªk7j$£W)™…¨∑#ﬂ,∑œûºäø|‹˝√W®˚‰-¸œìﬁ◊Q˜gOz~uvˇI˜ì?£ﬁõSxÙÏÀW{èﬂCΩèﬂIëò∂¿ITŸ∑	”¢é)W!`Êæ%¨7•».Wú<F«KâJ7K≈˘¥X‹(.l¨ıcÊ	ŒÃ&æïÁãÊÙs’gá:{%ÓTâ+˚∆É≤`*uCY}ç:|$tˆ€X˙ã?4õËÑ∂A≠¿πQ—ÄƒiF≥{¸‹¬¨2∑0+Dƒû≤z‡_ÒTàU6ÂYE“Pé[[UBòŒT≤^tò|Z@?Ì∂”£èΩ¿Ì≥º#|Ü„¡_o|á≈1@+	˛’xíã-% çLÜ†i.<À^1XÌ#ƒÁî≥ã§O.ÔÏ¸gª“çáÆÑÊÓ∞∂≤.;,≤~¬U2ˇ·§√!∏ò *∂Ã]µçúﬁ1xõY·mdçùﬁâ˙8√måñÒëVÖclÉ¥Ä`—µÂB‚ˆ@Ãœq`◊2¶/Ü§ÒÏ*ØíoÃ áw!¿Ocnı[Ëä~ƒÛ‹c#v;q¨Ãå´ƒCƒÃW.9$	Ê¡G.ı›?{¯Çßﬂæä∫^:»<)*ı‹∂†8âh£4Ê¬Oj-F=mR9E+˘0ëgyÌFãVK´≈sva{e}≠Ø≠ﬂZ/˜#mfRπ-_ö4êÉ<;Á˘e#8>´˜—ë%òﬁ}ƒ|ÅÍŒﬁsPà968YGÆî7ÊWä≥Ëƒ™Z-X∆r4Ú=Ãiù[∞xî˘üﬁHåU^ﬁëè "â€¥JM≤}0AÓ'7'i0∞u_
Ñ8U¿·$≥ﬂ$¸ƒõ~ÇÒÌgÛ§5≤#‰/pœ∏ıZ≈Ü‹Æ‹òè$‚ËQÇ⁄GÄ∑∆{äÛî<_lí≤i¸∂†âGÑÜG» CK˚@P¡6c?îÿOqÑ≈©‚|ﬁ…»ï-È([›¡¨Ù.Å0ºê“çƒUcRùı˙Urˆ%9Y‰[ò
FÆ¨:4\$∞:áv`zıFÆﬂpÒò‘ÌÚwò3BÊz€i¥∞å‚¡l(Ω/˙X(Æ/èÃYÀ⁄¢{F%Éî¢I:ò÷c“+ÇßX+1yÙ£M1Ö÷◊/-ÖãBqŒ˛Èê‚HkL2„@8Ù4|‹Ωí¢28‘!jCmıÍ_…âñ3[XEitê„ïÙ:bg>a·"‰‘ﬂ≥-sA^!Õ˙Fïé¡KÜáÂàö¿_∆ë≥dpäê¡H¡¢rÿ@´Ò•˛§©í4c¿·£±}0‘îÀ$Ç√±c’!Ω*K°§µJÇà§PC˚MQb˜á˜ô—Å§'∑éÑ\˝˙û,hôèH¶ˆÃ©Übåyc=I¿ÁÊ≥nÌÿı∏ŸìÅ*D?∫2

k|ÄÚ38g˙+.†ÃÅ$Î! NTà'Úåu80l∞x(	tòt´}Læ‘≠cë8§ga¯»ëu·õ¯MTü wlEl	»icwX≈”cf—É)9ÕÔ˛≠B·Ìj°Ä{˘P>±¨ö7qáºT·HìCXå.–W√´ƒ¿úrûQ‡èVe%U®0üûzë"Òˇ§`V≈i”vØ˘†b^ÒeY`çæ–1+så¸º´¨¬≠Êe˝ßZÎ†›™3K¶„ï∆ëú∂1CÒÀ9IŒC}.+G$~hb>ê”‰‚ô$û1êÌ"[á~d˛øÍˇ·~“ày)_€œ%¬"!IJ,…‡64HøúqÑ˙jTπráƒ¡|Ê–SÚöÍF¸”VmTÑ÷=Ho√ÙuL4…=*UÛD>‚NbÙ^≠Çeécﬁ<ÇªèﬂZµwCé$ øN@Ωˆ√8Û Ââ˝¨Ï@“ùÉ2◊m¢üØ‰≠Èf:ï≥[|DŒÇ”ÿ±:€e€u¡Óâ¡Rﬂh‰0éﬁ„˚gØéŒ|⁄}ÚÂ{_ΩézΩ›}Î‘}Û_Œ>zàzÔΩNø¯15•©∑·9≈gù—"VöÇ
	\ÕÚ‘˘#@}zÈi†>ΩO§‘ÕÖ#y~∆¢aC3˘Õ˘ÛäÔƒ‡Ö≈)I°c◊´ΩËmu…€),p:ªI‘Ê≠îØöFv	"h{5˜ö„∫¸˜≈ÉÊûÌ4˘KŒA‡˘özU+®^Ö`	°A·tˆ_Ô3BÓ=˙s˜7è¿í>æèhÍ)ª÷}ÎAÔΩ˚œûº”}ÛıÓõßR)Ω≥h∂ØÒ?›ØÔ≥æÒÂ≥˜>˙Q{ìfø©…ÉdZL‰	KØ5ë¸’\ìY!MQÙ Ó†∫≥≥s”™RPó±Ï‰@ŒÚﬁ{Ø˚÷˝ﬁ„◊PÔçØªˇ¸9â_ÈΩˇÛÿ\˜'O{z‰Å€∆2=J RA8‹∑ÎòÔ	¯$¨¸RÓÄ≠í^3Öê2’Ì¬≠Ñ$yÖe·D1XçÂŒ§T•åQÁM5|d÷—Ke\TÊøºî¶èà'=…^ìà√æàD`°ïÏCâŒòˇL_L‚°‹ªæÁ˝‘ê¬’zñ$1¬RÒV˝Ω‹≤⁄wÎ∂Î˘™≤ ‡ÅUÓM¡ ¡s≈Q⁄∂D<;EâKŸÙã®ºZã-b8ÏÅ∆[.ÏÍ$ºØˇü€>|^É&ƒ±œΩƒ#≠:Å¢9îÕ$Ü∆™≠Œ˝ÔÆ"öú"w¿*∂XΩ<aEÍ†ËÅÜ€…%4Ám§Ìßy‡Ú€)’∂I8ebÙÑﬁzäe Ω¨ß€µ&•‹Eäò<÷ﬂ|Œ/;‡ñ4Eí˚Õ¬áÔd[√ø‡uÒ¡™J‹ñ∏ØπLY(é)^]7[$I.¢‹@@PWéÂ,⁄¡ﬁÄ†áBB.[åÇŸ§]Nz∆øBÛl∆Ò§üaóΩ‘¨æÍrt—¯ËM˝íÒ—ú√Z0Iln∞\Xπ~nã•,´—œR≈óµËwâ‘Â†P…vÍT¶ñs¥n5Ì:J`ˆE1\º_;} v8∂@Ö≠⁄VΩ3—∂+6ëÒè1∫nﬂ≥°æ—AKZºëˆH;$˝D^°M~õS•FÒÂQ©jka.7!&ßË§πM∑hµõÄΩ’∂Ò`È7	zºÂ"y…Ex«πì≠πåıŒ»CﬂG”yt	%‰/î#HõôlZÊ3‚:(±y„]åé«ˇE&.ŸpËjá¬÷ıVã,Û‹â¯]∂RØ3˘’´5w"ª}≥‘*ÎÜN<Ω-ÿNs‹÷íùÌˆ §HÇªÍñ[∂]ùÔ “˘5 UåªÜèyŸS∑0_kWù=ˆ»ÅˇkÈ«u´÷êQXÕΩ·Ï‘kMˆ‘˘≤`µ∞Ú/ø}≈jZe"F≤G˛M'Ãwa’¡ƒÈ∞'˜-w£]€€≥qW‚≤&ñ⁄Ns¡™?%ﬁÈ|x–Ÿ‘èôg«´[îåHÑπ`€Ÿq:dœ/ÉœWˇ∂±˙®˚·ü¡ÙÂ‘˚—Á›«_?˚ÍU≤ÂKµ{Ô30X)ê0	≈èŒ"W’O-πá"{Äî§»´ü\±`i€’äìÂ]íﬁLo]M¸,21r≠ØøÍæ˘)Ê∆Â“y’XU´…æKëéÀ˚V€ﬁp`2 °7rF90Ω…n¥¿©&ØÒ mAàEªc’Vg«C®πu«Ì∞&ÈÔ§rÑº≈	È!¥bu*˚hæi’è›öÎ#‹πÙùTàØÚû·åº‚ÿ‡‘Ûùï96>G’Oläå•µ#u‡)£My∞V±ÆM8™7\Êä¨¡∂∑Î°§J¶∆≈yd¸@J®’@√„32‘ê˛új¢ÇêìUœE™ÖèHÂAnÕEÎÄÁ¬u¿c´&Ÿ12xbçK.ë–î8Ù‡[¥‹\T™ó)Ùû≥$œY5˝3’⁄Ó.~ÇV∞v‹Î;…ì¡ÉOmW5àp6Ê¡Ãèî7Êóã+Û≈]§Û+s(<x}y˛ˆr±\ﬁ~i	Ú_6z><ø2ˇ÷J€k´•µeÂ√ﬁ›´≈[•˘Âm®ZZZTˆt,°–¶ıÅ‰B|,O—y˜9êúaÑj|k<\|ûüµêÊ›™§^”ˆ5ó6´çgó&ìÎSk£z,Zﬂ(£≠¸A¯JB"ãO ø2Hf<∫m∞\,lâ1¨√@Ω©±”«–Ke°[¨óÈªƒ≤ˆ9∫Î€≠c®«rËe,.eRàúy≤ãOztÊï‰•Õz◊ÿg•˘Ó√[jmÆº4Sûè≈W∫ïFN>π9tê¨©◊äyÌñ>É$Œ*¯çØ⁄‡ª•ˇÛΩJÍı¢Iﬂÿä1—Ç ∂{J J3¯3ÕÒ†àß)ÑãuÈä+◊÷ÊKã€ãk+K´$ı)ˆ$PÚ¸Ñ¬Ñ•îêmì÷c≠©és‚5¿eüìıy+sÕ<GÓ™Ÿ†1‹jDıú€9Æõ◊ô¯®Ç‰Ëw‘AÙ€`c&‹e–Ò`k/ Î≈óè1-ÔöÔ__}ıÓ?Ì>˛ı~¸ZÔ˛4™‚£O∫_ﬂGΩ7uÔøÅΩ_Ω€{Ô/˝È«Åçœ∑√?Êà–Oﬂù˙“™üÉ^≠beùƒ(]¨mjÓﬁv)1lÔ€V5‰OÍìI)ﬂB°ãáÎ&z[éE"⁄∞7ôAî≤Ø≥KÍ” °˘’˘ÂóÀKÂÁ≈u}µà◊nTæ#˚Ô;ˆ2dÖ`≈ˇIå$Ã ïr*€uI8ñ∑c¬˜ÄµpØn≠UØŸm•òƒœzÄ€ÿfmsT0éNP√oi6¶'ˇåÀéaùTŸo¥@Îh¥:v _9÷]b‰	V”_ËŸ¶”Ÿ[?ˇtå&nû9À"Ù'j%w‰ ﬂmÚc√¶≤;πxKNW—(°bªa∑≠zÿ…®n≈¸<'$1ã¸hÙÙNL∂ÒâGÒ˙¸•òòmn¶n(úä™$[C£9
KvoÍ‡X‹LoÈÌ_ﬁAIYÒu∂ßAáˇË◊éoåÇàn}Ôl◊x⁄9‰«f∂w˙{¬Ôkúx“)˚Ôj-p˙(w≥VÔYÕÒFÑzOÌZƒB?Ô›°o®0VsË: e¨≠nœ/æ4ø∫1£∏Ω¥∞∂ZﬁÙ˚âôˇäSw⁄F⁄ÿ¬⁄ÚZ…ºµ:„Í‹[K∞˜UóçôX∂‡Ak;∏ﬂåˇÖ∫´÷‹~{1f∫ﬁ”M˚ K,ıÔø=·ŒF|—P-»-K(,ûMQüB8?∞JÙø˛ù»7âÙP˛ñ1◊∞Çq>˛⁄6Á¨Ñ=‚˚Ør\…ú'
¿]ÌŸù¢˜xŸÓOu¢mƒÍ» H;)◊&^Î±o-·˚o3“ë˝âŒ¬w⁄tËm˝ˆ2úÁ;Ô~9ı8‡Ç‚ﬂ›ZZ_)ÆnlóãÏÏ(wã‡ åûÇìÇª|äÏ˘70O[ï1tâ]&Éd”ú˛ıWø˘ñp¶~L.rÎ ﬂ~˝OˇàJ$Œ-ÿu{áÇûS#ÀY˘√WX¢DgÔ˛π˚ãG›'_†gOﬁ;˚‡]ôeÂBÕÖj›,'´z|ôª»8”ñ/s£>PtzﬁG§Ô7ÒI}IaC¶h…Î“›Iyü®ç›Dﬂó!¿A;°Ñ ∂"ï'¸Û!≥FpgN0Z)‚´ÅÃ÷≠vßV©€hÁ†çœ$õf/»O–ìÕT*5ﬂn[«âÈ±-ä9≤=éjöCï…‚M®ç7á`≈ú+fÆêño(v[P!>Aü˚>u´¨/Å<3≠x0Ü˝ö$]§ì;ÌVÚ‚IãP ˚d òÜèºí…±©„Ù#ÉiHìf»˚V,XUò≠|û¥K.ªµ&Yü◊N? “;©,ó∂Aï]ôN•ÛBÒî>JßPªŸØÍ|H\	˚B%IœRú!ä>Vx)O>ïÚcäÅUk"íDg^§ü8bâ¿º<ã6Õ≠êﬁRÕîŸ"‰åg^∆∆HI¥C®>∫ˇ“ïØŸa6,#ÉÅ†”ï(ò kí”&•Ÿè≠≥¨+˚ıÔ>4î¡]“””j£‘a≠≥èË1qn úBÑéQ ã∏8Ë∞ÇA“:}DÜ\fHp˛6èôÍ¥.e&óí˙»ÚÂBÄÇ†≠<îÖÀÊ3„ôôÃxÆ@ÍDIÀ/ÀÈËí∏r≤rú§QOf|ó4@[Æñß7èbZqÑ–TA|“ûbïß[8ôèÖ[=®ïVêÇ≠n¶SYª—«z•Èn”Uãÿ¶∑?ò9V£±X{ÿ1ÈæD⁄£–>ÌOúçïXôc>ÏêåπÂã3&ÖÃ’9E
È”â∂
l|ï€2H",„†gïæ¯¯≠.!XÇç£ˆo
Í1`∂¸ÔQå3"äèêº\6ö∆ÂMî2–‚D‘¯(¿ÎùKEæyøêpAu@ª·"1‹S°k∂Æ<Ê “\Ci_ÅF<¡ lzo>"µ‰˙‘‰ﬁoÔü˝ÚiÖ™13<=Y¬=»¯<0…?∑$0≥l /∑h¡i¥Ív≤ÆX™-7xˇGŸÛîXné¯tâˇIˆ¨wyŸQƒ`3wΩ&Âãê F:)∂jÆSµ]ñ.&\ìˆπÔ“ÅÕW(_ΩÊ8u€j&d/ﬁ"ñnRÄ∞ƒ/FõíœyÏ%DÔ≠¿ÌI¿ìÍ^Stfó™¿;ÄãÔ÷Ú£M_óÂ›`.~∑~|€ﬁÈ8XlU‘sn¢ô9?pÄ–¢◊ãÕÿ8ÕUÎ^mÏI.uÊ•ö}x5ï=§ø»2y"¸Zæ•KŒ! •gΩM˝MeG≈Æ£÷~øyç∞ÆÑ`¸–ÁEÙcµ¨¿V	ä32ˆÃ¢î"@Sb¶à"R©QïF*~¥∫£◊E/ùKàê‡ÅLF!Ä9}◊∏™©"®*\¨Q	›≈	TŸ˛KJå2x∂g_˛ÂÏ˝áP`+Å˜Õ•ª6ø±±\ÑΩR,-Wä B#É‚Ò«îëöyÅ®%ã»jTC%√ß4D<MwRMÿ•ñVÒª&k©¢4:ÿèw\a÷§BFWÖp©ëú≠örÛr¢8è‚sSîtËe¨¢Ó„◊ª_~J(–OYEÀ˜FOS4ód∑Ó8ÌD¬èÒ®íº{íPC≤M”È4ÿrÛüK(3ÃäÿÖ—õ∆çÚE2 S:Z%±æøb≥[rözèa∑Ö"~’§§£â±õÖ&è‰Ú/j¬—\âë©¨˛µutí≥éµKõîÖ,PhÂÿjFJEkΩiºäNíS"√+¥=`È›õv€!@ÑlÜ $H®·ÆÃ8yºØ’If¢EÈÇm,–Hé OÑA±59õ	¨ôóŸîçfä∑l≈z§ıº|‰ä∑R◊ﬁ2û¨ægàã˚‰ÁË“t>~¿í6˘¢dYæË°Äâ'⁄* ˛*üÈdxˇÈ"ñã/ó—≠ıÍWtMî?It¨˛-(KxiQ>7¡®›Øvü|Üzè˜øäz_?zˆ«œQÔÕ«Ω/èæáŒﬁ‡“≥˜Ó£ﬁoûú˝Í:{ıè®˚Â˝≥7˛l &nàP€úJ∂ô¬ É(PVÆ œVò»œ2V*P°ÛY;≠ºÑÇ›kEQ@FΩKÑeéÍúŸ∏•[µj∏!|ö¡?&G±¥àﬂ8’tä@ìVâc‚÷¨C‹G›©Pk	Ê0)(¬äW 1∫è«∏Ω€∆_’ç	úe∑-◊ﬂs§’´Ë?î◊VSXπrÌæ ÜÉM}P◊H u0LÏŒ‚›uL¶}7u Û17«¶flL˘jàN™u‡Ó'‘∑"Ñ€ùeç aËq÷[a›çûÌ†ŸÌ^s'$0P∆F÷S˜Em¡b¥:zˆTπ\H\lW∫ÿ„tÌ\˘áw_Çõœ1e”*°™CÅwÊÎvª£tìiw.û∞˘>Ìæ˘∞˜˛€œ áÁ8ΩÔÉ}∂˚„◊{o¸ëÇ$_ sÙù2Ï2:l,áëB<Ä.4x·ézéò4<ßÎ}pø˚ﬂmÊ:Ì•ƒzÅûU+£
Cì∞’D˚Ã©€)ª›∆jí*ÑY∂q¶"|JÊ‡åÃr
wA(r#\Œã∫vVW'g2äcnà\ÆøÑ9ïÉ∂Î¥ì≥-à0p¥>ö=K<ﬁ…	$ßT–ΩÂ⁄Ìı˙oíáA≈”!é˘jQëXY‘uuæ{ßUÅÉ$Q/:Ëà*sVùe¬8˙¡ñø≥I≈^H!i•[ˇ©Ÿ}Ûª˜?Ó}tñ„ˇ©IÕh›«ü∞Àd‘¯ñÅâ⁄k˙Î∑q^={Á¢ÿU¯IÚ¡–Ç∏¬Dπti∑¯Ê£ﬁ?c.vˇãﬁ„◊fQv–√Ûg>E	G}ÚMgSS/¬ù?}–˚Èœ–≥ßOªøxÑœÚ:{¯Z˜w?¡Õ´Å’1Ô€ÙnΩÌÏ÷Í∂ràﬂsïúb¸+íW2xΩeí§IÙºË[ï±nÌ41¨8svÚ6 /£yt+Ñ%|¥·˚n‘ÍU˙.%˚Ë¥x+9±|èE÷êöd∑-5›Ñ"≤˜ñÉ<¨&§’˙RäÂç¡mﬂ1æX<∂câFÎdŒÕ∞w%¿˜†v§~ _¡ôÃŒzeMX∞4-˙Ä¿Ô;äEãﬁáàã¯'†(¿˝?yóîi†Œ‚ƒ*¯¯ ê•46J
‡Ì{ˆÓÉÓ„◊Ò˝j-®èî4»1å∏?“°‚ÌZXãU xÏ¡(ÙøŸs<⁄yÃ¥`…&Y\*'>^âôDÒŒÕ)√=´CÔÿVùˆËÊn	.{7˙[û«8â© "Ó¿ŒÂ›qëÄIn¨ŸºiIó3ygtQTÒTò¿Î·1ÖÈSŒ=7¬|ÿêW¶4F Y≈_˘'‘Ô.õ•èaFR±Ì*à¯¡œRøñZÊäö>Ü(áıèC©"„xHÜæ(ÃêÇ|ÉsF wˇ¸c?Ü–˙œDôñÃ˙ıåœ!2uYèÍ
™£·ŒÌõÂmyBu+ñÀxØÁ≈T∞-jìÄ¥?á£ln'Z¶9 Wåß˜À—Ò˝Ú⁄âÙ@Ÿ∑aKG≤=…å¿©vE.®Ú%rn√M≤∞oﬂk;Xbá¿çòù“g6È⁄ ã4zÿ7T¶ +“ıÍ≥ßOPBYk,∂HUPèÀ∏…oAï.(Á©£ˇ“‰q|ú.ìz\Ív%Ôg£ê◊≠{≠mã¿äè™+∑cÍ¿˜)Íˇ≈ΩÚE‡˚Ppùq˚Pç†ã'·¶·Ù≠íP]EìcÍG…cPçuª„lìíf¬É˝ú9^ ëﬁüD¢WDä°◊¬$óŸ~ø`¢i(‰>ùÇåut5ÍH©" ŸY":yñnz»ÑÌ•†úG⁄ÁÃÆYÆÚ„ Büàé%í¢∂P9Ùêº‚ !wÎ˝≤'m∫JÜß	˝\•1Ú‰¡Ìä˜§˙˝UåÏä”¨∫\£à\L⁄,4åOÿ€öÜfœß´…~¬¢mµ%≈î∫˝ƒi8Ùcæ€ê~ÈßÿÔi`∆2∞çÉ{∂;{™?Ÿò{V
„SU{+¥Vﬁ=JåÓw:-wvb3?ª„¶µ£ªµN™‚LPFµÌR◊‡Ñª{4ëÕ¶…øí≠∂}˜îj¥r∫~Ã"´và»!©y:	Ã–Ñ`<% ‡≈œÅÌÍ+)÷a¨Æ	„ıXØ‹û“˝ŸËÏüûˆ~˚ŒŸ{ªø˛Q¡ïMä’Zäøﬂç¡Û–ÛE‚ù‘∏æ…ƒê€Íxâj⁄hW/ë)õèÑÔ∏xÖe…âZºJ:´?‹^ZúEÈ#véŸê”H ò.;E2Ö±îãπüù»é£ÅŸΩ§∑ÄI/°J°Õóã∑J≈ÌÚÀ´€k+ÎÀE¬û$∏G√#øÓœ˛Â	öaØ∑m◊nVlÔûÀäÎ¨L•ÑìÜèñÀ¬Ø‡&Ïb6Ë©B⁄KRkå∏G‚RïÔ!¬Á¡Rs◊π  z©WÒÍU$–€Òï—¶Ñ_†1âO_À‚tÑﬂ“b_;\‚◊êÛªÍ¯¥iŸïß
3|	Ω,>•◊6∞F“”J|(`√¡Øãüo∏{§	¡9˘G&ÜDzX≠¡,jùû=êÉ¶9E,2§⁄è¿ôËù[I8]Tã§fîamîY¢æﬁ;àh|(/µ˙‡Û4FíÈæS?hìcËï‰&>˚∂t`2°S®ï,P«†∏QÑXà*»p8“Ö#Ì≈îC^P£:€JNÎÿ1êè0TΩwé{R5j QÄ¯_’à≈^≈ÄıÂ˘óã%ÃÂã´K◊óäã ¢%˚Y	ﬁÃàò[ÀÉjé“ΩêBåWâ'FÎ(yà_*Oﬁ
7M/41ÉëFïûP‹,–@– Uº	à»∏ ¬7Bø˙Q/Ø›í˙[˜≥«éŸbB8‘Pñ≤mWWrm}}mÄ¬ñ◊~[Gy…∏—‚jqÂÂ¡óJ&`©2è¶aò~R÷€Ùt‡ì ¨Cﬁ≥&ımç‰h9"z§≠˝dÎHHÜ  ï€ÒÚ~.≤¯tuÕ"06”©<‡U–ö‰l¡∂·òŸf«L'o?7‰ó¥ví¿≤mØ;©K§%≠Éé*’$MÃk:I∑“vÍıKé.Ëó˜ªâ%däU¡‚üÚ•»ÒàM#¢»Zﬁ~Ò⁄L’™ßz§-uR.Är¯»K3fe[¬Y∫\ö§Yª&∑$*q¿:£Xg‘®®pó¬Ω√-è’Lãúf3ì%,dì‹ÃOLm˘∫m`\$0:π¥£ìMèÁ¶·ˇÈTvåJIwèÍnR≤•‘A˙'!5öèˇ}äjÓ≤SπKäπ∂ÏSâAÄf\ç®eZ%úGLjì‹‚n\5∏/nßØ!Dâ⁄∑gbZf¯$§§≈MÃ§Úœ	71Ã#Û‹	9wBFÄö≤ÖÂÛ„ﬁ?òÙeHMRˆô!…ZÍ÷_^D;„mˆ5+@(Kûî√ea àP‰9gÑ8êlÒ˝€5¡z-7Oá_5∞5ÙK¬íK¬5àz[ÑpMö:ä©£Ÿ´Rk≤c8JMÕÆ#∏v≥ i•,U∂fò™›≤≠Œ,¬˙7˙±ó≤9ZØ5m´-·ä∫‰HfzK⁄˜ô‰¡Àœ
áË“ÜÄ©ep3ì “øÊC¥*°˛m.ˇ.XÉπÛ~∏•"ÄÖ∑ k+hamı˙Ri≠¨-Œ/£$Zµù‰µˆÏQ∑Å P8(LM˛Glpò‘®˙xÏ÷⁄RH7Us°Ø©∂ˇ≠P„±¢>É?[Òfb,mÈïÚ>H›7 :Ç`<paÓçH[‡Ê<¨áàk'(ïJ¡7,¿ëuòEƒ(ÑN√<(t´yÑıó‚ìÊ$¨Bzj…9o≈Lö9ê(w	ÄÜπ<hòù÷≤¡ã¡ùáÇÖ˜ú«g Á0úÉœŒKP?ïÂ§‡ΩM@Hsˆmq•√M—&¡˚Òò \,èíı.#ãèçÊµ≤pØ∆paw(
±<t›§úÙarÀÜ3Çéƒ≈œ¿é2)VRX≥ÎUb»î„…oÿèR&35ÏÄ 1áÍxπ8¿9ë9$¶Sç@≤˛◊úÍ±—ÍdÀ—R"Â…|*‡´Û^ ®∏$ô=*6cŒíÑc=¸Zºı¿ÿy"Ç◊®~/ä€Âöº⁄Q≤ 8BJ.J“S:≈áœ>È'§¶'3‘õ©p
9ICH-°UiõEù»yAI9◊óŒÙêôê.œ’˘◊O{?•)Pπ>§$8”$∑Ä∫Ù´*Th†ı$n5¥»ÚÄ#Ûe‰"çÙÎ]tûe>˚‡ΩﬁáO¥ô√˛3zƒK√rnrr,MÒ…Åí·ÏÓ÷*pæ!wQ9Fîˇìµß®œÂ}ß5±Å≈©[-¥åè31\e|ÎNÎ†ıùd}ër:ÏèjTá&Âˆ%)Œâ.;dAQ›™FOê‡¿ÀÊãv^<ãÇEs“ÁòÛ!ı
\†'jhe∫®Ñî) ~{Å‘ç≈cd,Â∂¡Lª±k'æs¬@s>2†Ï‰å QπlTéÚ\:q®EFŒ'ﬂe!èƒ⁄èyüﬁƒO≈/ÓLÕ(ê∞Á›Güü}n¢ºZC›?Ω⁄˚Õ4›qµ|Î˙ı•Ö•‚Í¬? ù:gÅDÚ
ÉËöT_3îù¥õŒ¡ﬁ˛∂€t„`T"ò~9$ió™§À!d“îe¨Vm◊g2çWäyzKÙfò£b†P1à…P⁄aPZ¡O:d7Ü2çÅ=qîÕ“ı‡íòí8Å" ˝å	íÂöE≈gw9-P∫ØY{±â+™‰ﬁ„∑'z˙¨˜¯>=QÔ√Ø∫o}Ä7HfÄˆi“`M z "õ–o•SP|®d†~A¢:^ÉàH	%hìEô’Ù<“b˜ÕÒ¢IP“∑UVÃgfx4)¥›túbëHLL4ôE"Ì|7E¡∞uÒ<¢†lá¨ã≥Dc¬˘Q¡“8lR”lÇ6yC;Âvú÷:û>kè(d—p*ãb\yyï0:ô^©ØI6©¿¨åÏCÖf>¿¬Fﬁ^C√âˇ˜09ç‹ÈX¯A‚ç%ÕêıÑù≤
!\∆‰.ˇêÀÄó±ãïﬂ73”Qß=∑àÉñ#∏û≠ 4^Zÿ!Ïùq(ﬁQOé(,√„IsKïKøê6‡ÇÙ≠MúËùäıÎïE,„≈yÉ“í
¨MqbDc©úno#»J@“Hêú@ı∏lC¯Îb›Ül¿Yt¬º ·w«‰G˜R6Ωì¢›ûﬂ(ñF√—Ì≤a´·≥{!?˘CÒ>%´Mé¥0ß⁄‰á~∆®≤‚K5∞€`°Ù5¥ÿîr™TÆB›i€€wXÌ=dôû˝·q˜¡´Ω¢≥è‡Ã≥Ø‹˝≈cHıãGΩè~BÒÒRRyÀ–Ê˛<ê–ü•P-”(j˚6á*†&$9∑Éö9ÂÇÎe‘öQ˚ëà¯íãsﬂ]=”Gdπ@ª+ »H~R–Ç¯æ©pV{!Rl±±Ée∆PîÖ4p8Ç∫„Ÿ ï!√#W 7ÁKK´7∂◊◊ ©T*ÃN‡/∆	1~Ér˙#ı®1§‘–›~ímM´è¨—ºtÕ"Y	™YLéÒ y(xÜ=‚èáÑ±ÃùPµú‹[Ñ+ÈÈ2f¿ÔA+ˆp{s>‘î∏9'UhœÁÊ0òìVehnŸ!ﬁ=TÆ¥!ˆ◊i„KáI”CÎX6Åì+Zkujç⁄+·:,òzY´^É}±G∏òr1=oæ∞[›≠ÏV‡˜ÊŸt¶ö©
e&Õú¿3UQ,∏≠êd|	‹sSádwp ì„ë>æ∫u$µ¬Giù·kM†bäw<ä*ã≥`(P>ÿd⁄ºyb”ÊÕ"a1;√o«®≥tÛFi~˝Ê“B≠óä…Ö˘Öõ≈≠€ãjÎß8nø~»?)-,J‘⁄´B„ÑÉèòÄ˛˚S$ıŸª›ﬂ}J {˝è∑{o~ÅzøÉ ·Ë@ﬂFé‰|Ω—∂Z˚µä7Ñb·"Æwâî¿D=p^¸y.t√Uø⁄ªˇE˜çO–≥ßO |`ıøﬁ˚Ë>Ç2ﬁø˘=≠Tˆ⁄œæº¨œ‡m{|‘{¸⁄ŸÔí˜c{^ˆ´€púŒ>*§ØØóIn0Ë˜ë˜l≈‰÷)LBiSÀ©>¡ëérd#zûôl†Ä åÕ:ÒA kVª!d∫Ù›°P"ìŒA'j r!:é+DqÁ"M ≈<1=NñîÒ.€´ˆ2v˙‚ù® eêë_Í@ÃUêÔêËf’¶›Ñàtä´ó_¸PN∞õÀkÛã[ËÏ'?ÎΩÒqÔÀá®˚≥'x#û›Ç∫xıÏÉá∞˜a≤;	ÇõÎ}≤	v%“ï4;6¸j·C @“Üd›N_îµ)](©‰ï{óBgõ¬Ã+9>:T	 P·ó£eO∂ÂúπÊ˛‹‘öÔc"«‘0}íÔM¨W@vπg–Öﬂ $ïo©—∞´5,–’è#l%*#áéä∞∆KX§–¡˜Cer@£Ô°2ﬁ-fïe"Va37¸œ¥(j¡”‰a˙,yƒÔñ∆wÃù0|rπ.2U(ôvIˆ@dÂurÉMÙËR_˚–ií9¶Èª`dlAe¿êØ,fXˇ^z+ï)$aËéòXÀﬂùÖ]Z∑yóÿ©08X“©jlÄ±È≤—⁄Ü.¯cˆ0Ìr∑Qpi657ÄÆÁ–Íÿöí–»Ë®ƒ"xÜ¯û<‚É√^¬Tî}±éÈítK"2	⁄>DÙ/®PÏ7∫}–™B˙Ëòl≤&¢Ná‹Ù‰,Z>®‹=¶RqT¢|0î)2Z©5kIXç®Ç<HQvpG<Mã˜ˆEŒ°äò	<'ÙÔqbt§võY@´JmìX%‡ÔΩ¿Ï¶wøB<ø¡∑.;{1¯tW—ùø˝˙ü^Cõ›_ˇ˛ÏG3ì	Í˛ˆc(ùG¿n°KO¸˜8?>∫6ifF»F∂Âµtˆ‡3(Upˆ´üuÒ·Ÿ/˘j¬@fΩÅ,ﬂZ¯¡Àhe~c·&*oœó…™ßJ∆ÒΩòQRZ«ßG∏Í¡Ë=Z9ìücJùöEÎé€I:&‘Ê&FØg.π∞j«≠&—Q"î∫ÅIŸÖSÓ¢7©HöÁnãß[…√"^êÃ ¡BG∫*bµ[µ Ëıùw0°bö|„c’ä°&∆„˚X´9˚˘ÎP†ß˜—€Zıﬁ B#î6YaYB∑◊÷ eÙ““¬∆ZÈeÑæÚF,Y™:*)Êg—⁄Ó.(≈®x‘¬Ç19L'o:mL¯ù6V˝#4‹©"Ω‡éx™ÔÌã‡\ZÍké+êfDéˆQã˛°Gsj˙ÌÔ—fÔøæ›{¸¿Í˜^‘{2˙Wœ˛XEF¯™ﬂÛ))˙FY$∞∏ﬁÎªèøécq–) ]\⁄XZ[eÆ¨ß•HØC•†‹,&,n`çÎfMXæ™‡Sàû∂Îv'J>Ïˆ‡n%ÛÔ0‡]¬Ω}≤-*”‚¡‚&[vÁDÒˆˇèYÃ[ ﬁˆŸ?˝Í˝È—≥/?€BOp≥°Ä¬i‚/.Xm∑“ÆµÄ¯O«ê˜‡èz˜ø8˚‡]@Î≈¿GÛ´ò¯∆ãMeÛEË†Èb]‚†∞∏°˜/Kc "òôE`g≠‘∞Fπb¡Úc∏Ê¿˘9–∂\…IÊ=¿ÓWQA¯æxZê=1E¿»Åq`=˛4¸¢™^¸Ï	fÔ›Ô˝ÍI˜√?„√ÁµﬁØq@å:Œ~Ú†˚€◊…ç¯ëè>ÈΩˇ6ª±˚ˆ√ﬁ˚zÓ =Õﬂ*Õ£˘ııÂ•‚¢–6ºÿ⁄õ4X$Ï!í¡LìArrv—FªÜgÂ”…ÎP†-Ïc-⁄nÓI§oÚÃ⁄.}BIpΩ≈Äƒõ˚]|PIdË∏eRcWÆ) ª“jâ“[¥jb?‰ˆ˛ü1πΩ˘®˚¯S‚“¸Ò;ò»¯O{Oˇ∏ÖôÃ}LYÃqÿ˝Ò:¢¢—,†›uﬂ}∑˜ÀßcÉ÷7÷nKhÌ:⁄(-Õ/ó—ıÂµµíﬂÀöw¡áµ–FºoC%±f+4#!ù˜Àÿ„π€˘?   ˇˇ‘]›o”0ÁØà&$òD’≠ÍFŸ¥á≤B	ZﬁikB†M¶&ù∆™˛Ô‹˘Ï‘±œv™Ò¬À‘ŸøÛ9^Ó#ó˙å™PﬁÊK‹éúqFh˚ÜôQfÿf“ì&ª⁄f'ø}f≠ÅñﬁâkÖ![,y«¢CC6Ø∆õ∫‘jÛ?ì€ó2Éae"›≤†Ï·ﬁ2Ûµêi"V∑∞ºóÃÖ Å Ø¶hÎ™*b(,ë3›û/TIà"—óß‰áI@†ÅàÛ.H¶√äd°ªt|‘t¸Sæ∆Iìr≥5¸tù(à@„}è–F≈¬≈¥≤™P™tZá&≥ÊîûÆPgá°03ñ≥Ê“4¡ÁáI%à ¢ihª≠)√”A#ÁÒz˛è.∆fì¥"ÒâXU«ek ˇo°N‡êŸ6˛PYm1™à50¢,±
’,Yﬁ--å4øsÑ´œR§≈s}zv8;ú∞N:`ˆ« LÌc*›úV»ìíà™∆E∫¸ß⁄
w98&T«ÓŒ¶»˘°àvÿ†âbÍ•riEï7iù^m˜Zß˚‚n“ãÊƒÅ-√érÆ.]:}Èå}&˛ÆÕØµw>û3™æhÍ7Õ⁄*0´⁄˝æ¿Á*hÏ—ëMÁÙÅööb8Xik%ãèŒµjÛÍ˜ì<+ u;ØÜ©†€YœúÈì.bÒ_4›yÜ_¨:  aK%ê¬`«ø>
’Z^√âtÉqr˛≈Îãe¶ä.î ®4/Ó“B~ó˚º…Áøìâ¯!–∑ñŸrIC·üÍ,26”Y¢Év£ÿ‰ÂŒïCt-÷Î‹õU	/Ó]i--•nÖÄA˜z3õµÇ+G»ﬁK∂£»~ª˝>ì4Ωßn;Cœä1Ê	ö◊∏:úKO∑•*_;éÒ`7¨¸Ì‚¨Ú"‚v·:ØΩzy@Ø–5∏ú˚}_∂Û¬éT®Lœz_g'ﬂÿ∏R|PiCuè…òï	,o∆z±\kéÏ|®—¢¿;Ù—¨¨aÀÓFÀ˜¥?H»¸RZ#ﬂÀÇΩ…,zø“˘€Ã$Œ£ñ˘m;v¿ô'g‡ErÑÓ0
Ç¨◊0w-∆≤»À∂©µôÜúÖX”îø69ù¡Îôc@W–bU˛ ŸHÓ|≥Ì ¢~3ÜïÃ+‚rzº#∑29KÚ˚ÇÍeµ˜{HSŸ·{H{∞ﬁ≤X»ÖÇ.0œ«75z©`ˇ( ©,puX¨¢ì ~Qv\çU
ÏâªÀ'  ˇˇ Ñâ