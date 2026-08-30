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

  // /profileÏóêÏÑú ÏÑ§Ï†ïÎêú Ïú†Ï†Ä Ïπ¥Îìú Ï∫êÎ¶≠ÌÑ∞ ID (hero_user_avatar / photoURL Í∏∞Î∞ò)
  const userAvatarCardId = useMemo(() => {
    const rawAvatar = effectiveUser?.photoURL || (typeof localStorage !== 'undefined' ? localStorage.getItem('hero_user_avatar') : null);
    if (typeof rawAvatar === 'string' && rawAvatar.startsWith('card:')) {
      const parsed = parseInt(rawAvatar.split(':')[1], 10);
      if (!isNaN(parsed) && CARD_DATABASE[parsed]) return parsed;
    }
    if (playerDeck && playerDeck.length > 0 && playerDeck[0]?.imageIndex) {
      return playerDeck[0].imageIndex;
    }
    return 1;
  }, [effectiveUser?.photoURL, playerDeck]);

  // ÏÉÅÎåÄÎ∞© / Ïù∏Í≥µÏßÄÎä• ÎåÄÌëú Ïπ¥Îìú Ï∫êÎ¶≠ÌÑ∞ ID (lastOpponent / AI Îç± Í∏∞Î∞ò)
  const opponentAvatarCardId = useMemo(() => {
    if (lastOpponent && 'cards' in lastOpponent && Array.isArray((lastOpponent as any).cards) && (lastOpponent as any).cards.length > 0 && (lastOpponent as any).cards[0]?.imageIndex) {
      return (lastOpponent as any).cards[0].imageIndex;
    }
    if (lastOpponent && 'deck' in lastOpponent && Array.isArray((lastOpponent as any).deck) && (lastOpponent as any).deck.length > 0 && (lastOpponent as any).deck[0]?.imageIndex) {
      return (lastOpponent as any).deck[0].imageIndex;
    }
    if (lastOpponent?.id) {
      let hash = 0;
      for (let i = 0; i < lastOpponent.id.length; i++) {
        hash = (hash << 5) - hash + lastOpponent.id.charCodeAt(i);
        hash |= 0;
      }
      const mappedId = (Math.abs(hash) % 110) + 1;
      if (CARD_DATABASE[mappedId]) return mappedId;
    }
    return 24; // Default opponent card
  }, [lastOpponent]);
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
                <div className="inline-flex min-h-[36px] w-fit items-center gap-2 rounded-md bg-white px-3 py-2 text-xs fontxúÏΩ{w«ë'˙ˇ|ä$ç1∫—O¿q@í∞&Ä,{∞<ÕBw®awWOU5∆=‘òˆ—äÙΩñ,J¶$zG∂dØ|ññhõ⁄’‹{ŒÓ7ÒüÏ∆}Ñç»Ã™   ¨™nê2mOK–ı»gDfDdƒ/Ú[-£qïxÊæów[ÜgÊgkE‚ÓM{/Ô∂«Œ˛â}Ω‹x€r]ÀÓ‘£s’ÍÏ‘∑åN«tÍœü$-£≥”3vÃâ#≈€ßvÕké›Y≥vv=‚ZØögK’#2ØÍÙT”∫&_V\å]:=µ’Û<ªsˆÔÑãáSO.VÎÄ\bçw…Ç›Ó⁄≥„ëøü€zö>Á?>5+%”±…Ç·4˝B…%√kÏ¬êêïk¶sÕ2˜»y:6r–d“hÆªl¥Õ3c{˘Ì^´Eª◊iöMz≤e;Mxç˝‚ì3S,í≠a¶∫˘
q€s›|ïÕ·ﬁÆÂô˛¸Ìªd€Óx˘∂›±•ôî´ﬂnô˚‰vK§;ˆ˛E∂›|F ⁄ÛO=◊≥∂Ú[¶∑gö≤c@bt¢,?Ré˙=’¿îädàc≥ì7⁄[0,µbq™Tì∆ä›™¬≠Jëƒkˆ{¿ø“q^Å±s¨Œ’|ëù¿˚Æíæ˙ˇ}êçrYﬂTed≠≤≤~x€ÌÒu⁄‹ÕR±ªYÏEØ€5ùÜ·öƒs‡;–h~œj∆G \Aw›‡ñÅ¸ˆÛ•BçtÚE¯ÂOêf§Û“‚⁄
π¥¥ææ¥≤L÷ø∑æ±xI›ß)Ï‘p˝-aÖï⁄®m«&)ÕïxkÊ7^ZZ~ë\≤%öIÜªïXÛÄÅìXÎ⁄1⁄bl€ˆp5m>ÙWUrÊÃ2~’'öæù#Wﬁ'œ∂Ì¶ÈZfg«€=¸∑ﬁøC˙ˇ„·‡áw»£œn>∏A˛œ;dŸ.KˇœsáÎ–˝NN|g¢–5öÎû·xπÚ$/éOë„^¸ÏAˇw…‡ã˝ü¬Ø{7˙7ê˛«æ¯Ì]õÊ»ï€3Zr´ÇeÛE*wÑˆÑ˙ÅsEπÁLÌVFﬂ^2Ûß∞4e∂	◊o‡ô
rLI‡ â`›qÕ÷vﬁ≈^"≈–oFœìp⁄¨aAA?Á»∏?âÔ‹Ôø˘nˇó˜∆a¶∆Èp^Ñ÷òÕÒ#˝´+˜∑Å∂Õ∂È≠&]ZÑÌ®T,>OrQjòä~ùP◊ùEÄK›l#É\WÜ©hôFóD«l˚f”ü7/6ÅS30áûb5éèpl–Ä5˚ø˘§ˇ”{Q>ºùî˙üΩŒy*Gy Xea~ÌB˝¬¸∆¸˘˘ı≈Õ“ÂsœÚZ&˘˛˜aÊﬁæ1¯ˇÔ¡œ˛Ø>ºÒ—¯—Dˇ◊èo‹'É◊Ôn‹Ìﬂ∫éL˙ËÛ{Éª˜DÆ˝ü∑˚ø˙-}é÷ıË˛u¸€ø˘ºxÁ¯Œ√¡∑Òπ˛˝˚É˝∏˚ºG˙øÔﬂ|ΩÛ£¬ïXØÄπAÿ9 \*nhõƒr	øµ”Å¡4HØc˝sœÿïR8 I€é›f\Or⁄.◊A“¿^œˇsœp,zÖmßiùÇƒıßß∫QqêRá$∫]R#Î¶·4v…7†MûπcC^∞Z»–∆ñõ"≤Ee&∫ qA(§îEÊJï≠‚tñm5¬Â≈ÜYŸn°$Hó“› óH«Œª«nµ∂áDòìuHn:≥Mï.@¨&¨F´EÂ˛-≥ı-»6Ö¡gp>£}Ö?¥ÿÅáÊaò‚Oê£I}=ïf§ö “ˇ¸˜É^ÀŸ¶”ókì3gIª–gïr$º=°n
Ù{ﬂlçRNbÉ∑®7“h‡¨„õ[Ã_◊¥˙<Ω;jIâÌÆ0ö—v„ÇÛÂı¡˚t√»T'/D”˙yzw‘í[ﬂÌΩ˙™4Í«?˛r´€Ÿj„Øk⁄ΩJÔéZRbªA8Ô'˝œ€É˝r≥/≥U»K–4}Åﬁµ$≠.⁄F7/b	áäé5@ˆà—¨k∞-¢lc6<≥π VØ¨Ê?(ﬁvLØÁtHN-ò3_#p^5Œ≤íU!~ÏŒBÀj\=sòõ–5ü}∫-„`}{?7æÎy]wnj
ñ^”smkˇ™ÂˆÎ`›ılˆˇ)w{™\õû°?Ú]«D;@°›≠åO®∫…>P‰∫4<9÷‹ÍåŒÅˆ›#]√M‚∞—Qè"~∆4")’J@kò˘éΩÁ].€Ÿ≠&™ê◊Ú`∑œ√‚O=«µù|◊∂Ëƒe_wi[ù¸n~≥2M5“Ö|L≈ Ï√ÜY{Â´±à.(W1n∂Xç$c	Œ—Y	Ç‹x*êÔ˘Ö2\ÿ≈Ìv.®\]…J√!:eU)∫#ieZ|[Ï®ÀMbäÊƒ	Î(÷DΩ‘πÜí’∑{¿V@œT¥ä PqÈÂm∫:0¡).Ìp-¥
/Éêf∑z07-s€ˆl|¶ $O…ìN√Ω iCqk„i´”Ìy±q∫\{àœÂ5£’É&±~~ªp|ËaçŸÖ…É«r&]e(ó/‰Ãà¡;¶W†Ö)Ë÷ûÜπg:g‘*WÂ©^r˚ù€˝7ﬁ~ÿ∞uçÎÉ¸óB°@5<>¶TNß[±≤ã≤yıp|,ﬁî∏µ≤€ œêÆÉ?ò˙+ÚZúCÑµ≈_Ñâ° qÿ]AE€∂=wŒÓy-´ÉkQ«‰ó"5DL©˘±	Áç|„äMFø¡H;á4ß„„J˛Vë≠ÉFp™6d§\æ»ßq‘@`è’®¥L}◊Á£≤∆‚Æ^%&d˝*fp◊jX- ^t`À3≈èK≠ª&ﬂí‡∫wÄUñ1ßÈí.–écÔM»˙W€∞:≤‚
Ï^ETm™§›úÉﬂ3®|q√o†û˘{3¨D∂NÃ‘ çE‡ÇÓtêøfπ÷VÀLQÁv∞è¯Îs°(fr€sëí´ÅÜx¿m˜pç5»ı@‚æ‘YÌaXô»f6/Q•Ø\{§«}ç√∞%¯Ö« Çµ|âØ¯ÏAúÄ%‡—}˙dc◊p`œ5ù•&jﬂ9®Ü|ìî˚ûßs|ÜDı¯†ÿÀXNÙ^.Vöá¬…Û§T*N`Eóì*¬QáäÇ:œëúrü‰˜πÈdN∫P7;p±Õæ%ÀrØ˝ÇÌ¥ÅzMÏ ∑Omè'„Ö≈.LMë≈A«#@d(õC}€÷é¶ Ç¨Nr~ŒL˛6⁄F:fŸQ^tiÛt˝¡◊ŒÕìqﬁïŸñUÜπÎåC˜X·Fèû–Fó!z°
DÙ;HS”Eÿkﬁ∂”/◊±]3R.Ω îKøg+◊∞†π0$B¨N”Ø…Ωz©øı‡◊l’¿öÔÌJ	±£±*vE®å]»V]tª#’{ÂÅ_ﬂÅŸ¬K¨ê_j‰W¶3Uâ€µ—î™l#	Ö—Ì9›VtÍ¯%°V~%©£„q…ù}≠»¬6î2Æ“Öà¿Ïd˛’áˇı„Ã¥˚’áo˝Ú˘’á∑~ÛÔﬂ<≠˝ÈÁ˜3ëL?∫˚´Så€u*_˛ÈΩ∑∞Aˇw±ÚT˙”mı…Ï´JÜ™Ùm≠Bou@5Zgâ:´ÂÃë‚$Åü•öNE6:,Ëf‰ù}ß®{%T|Ò≠&h/Ù%√€-ÄñKw»ø'≈B±2	?+∫R@Nnô/°åRΩΩ∑ﬁ5TZ:Gè` ±	y(#¨/6{é¡˛.∞SÍ“5ß¶∫aÖ9±[ ø0…Oß≤z∆›ÊŒˇBÏ)éŸÄEGuÍÀ!·$<›.`ùv'7ºï≈Ó|À<∏`Ôu%OﬂukõÄŒîÃòg±CY*ºH`◊ó Y¿Ä]ˇÇπmÙZûæ…¯˘z{ÿ·Œ2‡Dap‰◊”^æä MO•Í‚6øP.”∞Ál>[™ñ %Û≤ˆƒVP[πçGvÖòÒ3nTj«dQm$P.v≠fz†äÆlD£[ 6t<i8ñëßVü3áWû;‰2ÏH—Àv·πCYh="pçŒG sÚ®s/2Ó%ÿ†}ÁŸ©I¸»ÍwAÖgüjºho‰˙ﬁ›ö¶fÉ+~˛:õ‰‘#ùïÿnŒÚ©˝bBÀ†÷G$ÛIõØ„a7<ß◊ACzB©ä≥s˘Ã|gúu∆aÆ8e¡'tˆÒò«ùÔg¿Fc&268Râ-'HZq JÍkÇ'èf4t-ìm!t‘\≥mqãtÜëJX‡ç÷∫˛€ôË¶»ÿÅìüñ°Ë≠˙˙—“–ß Å‰¥Õõî4≈â£‰¡•<{ËK‹ZÁë§Nç	~j¥3ß"]£ÂÀ&ÆÂõ@	piŒÍ†qpåUû°‚Ù'C5ªkÔ¡®(≠Ñâ]I¶‰PœU"jcUÕÔ∏Vãö˘M!BVA«Xøí!À8iN3ÿÀ	|¢:>?∏„,¯ˆ'∂Ô¨⁄,fñGŒ€˚CÏ<‹LòÍ⁄6®|Ö«ÚVΩõØP£ﬁnæJé{&ê2 íîQöˆ•å«hZPOﬁ≥aOCüAŸΩ˚8à!ïR±\⁄∞·K—(Œî™Iã1–y`ﬂ:˜dΩ∑Öˆ≠•ŒUfm’èO|Ñ{¥’Ÿ0OwùMl∞—
ûkXN£e÷Ø^+>_Øüütv∂å‹ÏÏ$4{≤\-MÇR231IüÆ·¿;ıS≈Á'`!bMû
≠.µﬂ+N`¬èæÀ¢±/â∑πWa@?ÂPs]ÛL»†M“3è3·æ¯Øá.G
…róùW%u-ãâÌÏ≤Ã*_ô>ä≠TFA≥Èÿ›<ó/[;§}êØ&W~§c-N;6Ë{mÍ¶;πàr$Äj(„yGˆãóZØ£¢-Z2∞=ï+ÒSé$Ù•6•êWaÖdrVÚﬁ(µHòÓnS3 [¬o:|[≠û#ÏÅ|UeC\%®ZDÇJ\≈Ÿëóx2Œ‰“6ˆÛ{∞}üøúQ~ûUHÌ%ñDâ¶º]ÿ¬}|⁄úa'ãèf(ìJ—"Ç$ë8Ää}\ÎíåW6¡HÓ`⁄ññ2VOnGC7g≤AO"æ¯>/u∂Ìaµ©pØ*K ìﬁsïƒ=E›ÂDäêRˇR	b˚t†ˆ∆<âπÍÊìêOX‹;√g;qùLá•˘dL¢+˚Ñ÷±4˚ò◊≥ª´–c«H3î∞œ◊eÍ¡¸bX>πv „Z{˚Dˆ÷l¨î≤˜Ú”LŒöéh/;=K7ß4^˜ß‚Á	¬1∫O>qsMí∞®≤’(KY‚hàVµœ˛çè˙ø˘!È˛‡—√˚Ãùc◊ﬁ#L∑·X]ÏÇ¬y#¸$3ƒπDF–˚˘OúP/ñóëNz†≠6¶ñ˘kÖdP—$ÚßªøÇ:<«ÓÏƒƒ∑–˘%ê@GvtX[Ë{'”T’zg,Çä'©ˆüs@Ú0|s}y]ﬁYåàµLS«æ-§&–<ÁÀ¿füäs“?∑A8Jî}Oh¡I∏©˙ö
èØ‚˜cd‹¡≈É¡˚èﬂ˙í˙q›¯h˛É„õ˜˚oëG~ÚËÛ{~ƒ’üÆøEVÀ˘≤B\8ΩLï÷˘¶RáπÜKK«;3Ü2fl¸N=Ëp£ymuAÔˆ∫≤Œ<;M[uL◊Ï4ÃhÒá.,R¯.{U!Å&ùˇ)˜T˚äÚDOı†πoyÈ≈âãïÖaAæÜ¸j~≥\úM˜f%]P”§b’Å°
öJQ—ô~É_Dø%CQñ¬gMúê‹∂—rUà*/±ƒÉZa™‹Ü—2Ò∞rñû©ñ5á™¬úÒ7œ`˝ôÀX∫Ëk Âà ~KÎ£81¢#À<”Ê@Òˆ#µ}RB©»7zVßåÆxCÔÖmtqÉKç´‘]â∞$6Xî∆+SD§n°⁄EﬂÉÈÆoLÌz∏d≥ﬁÒè˚äÅtR‘.µ«,…qup„ﬁÒﬁß‚Uíxx:ƒ£D3°-~é(ZS∫5~3ËKõA[Äñ7±vMqü?¸‡5ZŒöπ«
—yf´ÇSÈùDµbTÜfÅ–VπÁ{ÁG\ı}~°/:∂Àíwπò!–^ô√M¥Q€—¯·k˜Ë¿ïUa4ƒ
≠îê$ÀÍ˜¯xL©Ô :„ Å§¿∂⁄òÓ!¯HE∑	D>ﬁø˘—‡g?9~õÜrb¿#¡ª◊1ˆ¥ÛuŒ~Éè~2xÁˆ‡ê˛œoø}Ω«Ÿ£˝_~…π.n<º˜VÅ<∫ˇöd·•X	/Ì¯≠[˝{ØÉ‰Çı†<»¯`>TtÔÓ£œ¸ˆØy©æıÇºk€∏<al(ä-vT?Ê8Ã¸’çNi’⁄°˛Íd—hÏ“;ƒﬁﬁ6◊è7≈€®”Á±=c∆Çñ•áZNÜù=∂¬‡‡ˇ‡∑8‡ø~@éﬂ¶∏ëëE·æE}¯?æ1¯‡á·–±˜Ô›<¸Üıü#˝œnøÒ%tˇı˝_>¿bq‰o<$La§∑>ˇ√|£Ωâ±at1ˆàŒa◊!3c◊¬ËÅy-xªËæƒ∏
'b‚î–◊@\'M”3¨†@˝¢ãz‚,IÌå∆o|Å·–1˜Fˇ_oë¡Õªîˇˆ⁄èp,ÿ8>˙Ïﬂéﬂπ3¯‚ùï˜~‹ˇ)ê¸Ω!GÍ´”¡xfF¶åBvª€2iòs@¨00N«%vè6¶À!«Íª´ıF!≈4óá#tÇ™ú4√‡·fqeµ2ãÃYt'“[ñ|–C¸¨$€E∆Ä6¸åÉÿFvÛÂË&€t∆ı—f¯±(ıI+Û{µ:Mk«∆%üÓÚ‚^®ßìD€≤V°ù–äz=U7ü:1æù<Ò† ›ÏóQ^ä‘ëCõ#ﬁ°ø—˚?€Ï˚2Kµ(»,ÏÀ” ≥∞è`»[E€*lb˙Áç‹®r≠‚iRœtÇ‘CK±‚iß@¶è”§úx˚∏…„õOÇ<B.ÈÉ_´EHø6ZYVF˙ü,t1æM+#ΩÇW“®!Ò{î)FK¡O‘á∞Ñfüπ‡¯†%”rÈ}ÙYK<mU[Ó©B∑ãv«L0”è»§	÷I5 YÇ—R/R˘È)ÖŸ/∏è√ó;hhY∞C¡èõA¡6Z#bí	ë≈RÿÎ±Joù hDÃhBÃb@L2¬ñT≈~®ÑÉI2\ÍMá3
”aº(5«fB√ ÒHÎlfﬁL÷Ω°,áCŸ£æÇgrM‘˜Q¨Õ©}∞›$¢ëQv„ˆƒÕbΩXØ¡~Tß.TÂjm≤Tõô,Q™⁄DÇ'∫otåû‰3j*%ÿ ”q—‹)˘©9ÃO-@ZDœ¥0|,Êíj¿î]∫√‡∑≤⁄÷xB\ƒı]Àl5Á[¶„oÜÂ™Nj¬pj w{@»zÀ—n9VFk'hë˘^˚¶!ÍwqTëTúzC‡•:ıGà†®ûû⁄-gß‚Z∏≤˝√tægÇî•D˝⁄—ë∫_:é-«$ºZâ—ØÔø?ú@Dûå *…ACRÈ∂ÃŸZMCëzQ¡ßèº?MŒÀÅ$À±X≤pÂ^æ4ç≠”1·:’ìπñ∏nØmé^&.û•örÒ,√⁄ÈsÒ4¶°ã8=èƒ€∂ø0Ãƒ>px”¸¯ü—¬Ú‡Am¨'P_‹ayb'W¸XDa,Ÿ—:Tb7ÆÍlŒSîÎî.P∫≥	µ!\ä«à˙V»fÒÑ”*¢Yõ¶€HÖóVô…Ü`Ñö∆}nVB^ûöÊî+Å%,«•´q⁄b,¿]D<„ôôö5UÁL£w!8&å c£4GE¿¸llπu◊l£eªf:≈¶≠ﬂ“EùZ¶ª#‘™P÷≤È^;æØﬂﬂÇæ*Hß“|+“∞9e›kL°MÖ~î`î	ÖπÊ/Qeäa¶Õå®+Õ¿Nèˇu©8Iˇ+TE	B‚ÇQy¢™íÊËA‹<∂‰ï≥⁄]I
R√‚lY†∆™ÿÍxΩ—¡˘Uo«˙˜[ÅS
Jﬂ©Ä⁄#˛∞{àY‰ãjeMêL¬Yø˛òddeÙ∑∞yÃá¸âÍiäÖ"mÁÌ
òl;l∑¡‘3ñ…ô¶æ(§Ë§©rÎS*.jâk8˘ÙîB>¿/Az ≥‡RıÊ“˝kh±4µìUçPZÖ“ö$êöùÊI•—QhntI4—À≤û2VJ†?YƒWdíÙçˆCfJ;¸ÒªoﬁHÌ+ﬂRZ·ˇ"Ñ2äÊ¥©ê^∞‹ï.Ï±‚Ÿ,|ó9|4kx™∞áü8á,≥XÊI°@qZ&	õô9B’(r?Ã?±º7S£bYÂ	|âEG±ê+8 Ì"Úh=8o€”u·ıZqí4çvÓÄ¯8Û-Ó∞ÆèbqØNNW&g´ôÓ\ÅHÚÛçØÃ]ûÇ•®B˚F4¡ÉÇﬂŸ1ÂCNŸ∏Œüöf∞!√àxqo‰ªY¢RY6%ÇSe¶/+Gh-qqÒ.Ù{÷Ÿ¢∆z_⁄ã¨∂Iü÷⁄ƒ¢Æõâ·±à6¿yŸDõhˇ⁄¿∂32ú9;8œ\˚≤ıë
[#pO“ê‰P2À…WdˆQ@Õ"fÎc0aò“îµ%Ú ˇøì @É?~2¯—-ûÔ$ã÷êr–c1kFh°ËW}§ÎHì;™·Rös¡ﬂDñeìfQÈõí8≥$y‡ÖU#Œìd√|å¬0€ßQ"˙‡òhg]Ä-∆n”=ÉQBv§5¬J1¯–w›√Pñß√1iﬁ∆qîü˝íï.K˚Ë£ÒI–ï…ÈÄò”ô€p∏1'ñÏM¿ó¶ß[Å§Îa‰8¸Ù.ì Ñ™Ëa€ÁÌÅ!ÄÆªØ¢∆®è"CÎoRdIVô§mYkex QîÛ}z!:xJ®,äåDYä›>‚ÛÂªÈOÂâ>Â[®–¿DRo#ï‘aÍuSéË≥;fGR»µ„y£î{~<∫ú+^˘j1z‚zIùÇ9÷~÷kã-ARø∫2˜™°ﬂ√Øå\E6èI=Â1ùoöéŒåÃ4ëÅB·√gY≤≤øá«ª√§äë]Uûâ8ÒW *ZZm∏^c¥tÕø)•r©ÁI⁄L5‘f*≥ì”3¯?=èKPß≠ˆé¬»Ë:ç3áWÇ≈ÆKr√‹2ß–∞€Sß
˚SÂÉÃ∆†≈ß‹k;Á\”lûyÓP^%IÈ[’Ókg∂¶Õ vıä c√hyg∆÷l®@·r¶Ö["ˆ÷?Aµ0]◊ê0¨}\¢Ã¶btÃm”q˙	X˛‡ÃXî)~)ˆ¥¨T®v4yÍìΩ$îO+í#rb–ùbÔ∂∑pA@Vµ˘H◊õ¶Gá^‚‘L∆DZk9XEoÑ†P]lv;≠@1.ŸrAº¿–^Yz‰^óaﬁ`$˚‡∆√˛Ω_≤P•ﬂë¡Ω∑˚ü?ê∏ˆêÖ‘ltMÚ≈ú6ºõÓ’x.n:Ã∆Uûß èZ‡'ﬁä;9ïH ê¬Yik&ÊIKﬁ,Jyÿ√˛t«√˙bœ£¿ÒLXˆ˜øOû^û4∞™*r:¶≥s∞ j¿îF´—C∫g©4÷Ÿ˝\P√§ÿ∂…∞WÛü{VÛL®Í1ö◊åéG≈C©Œ¬6õΩyˇ	’ÎÉXa~acieπ>·;ÛÀÛ/.÷óVñ◊7É“ïÉI≈‡$Se+W÷“ †ÓÛ∫–äΩÓï£rŒ∂ˇ!=÷√ß¶í^òìãnZn∂“#&U º„ßsWı:ò”ãº˚“‘˜◊MóÄX3Ø<w∏¯ÌóóV/-.o‘◊7¯|•Cyåè#¶p ìœ~WñXY@L'ﬂ‘ø±äpîÁÌNœ=˙”{øêç“—·Ø÷;v}‘èi^>ÃΩ¢≥&ÜûVæVEü†„ZB£blÔﬂAÄÓ˜ï"3Ó·wÊó8ûBQB1æ–P	Dà∞àÒà•·TƒQâæ2~tEq¨*gCô2¡∑®NŒ°ª•˚:ö/"ı]ê„ìùb‘Vßnd⁄©¥ü;óeó°=∏J°&ÃrD˛˜…æLçºôóz-œÍ∂,”~O+rÂëö:Ü	ÜILhWÎ4òá·Ãß⁄ü√ËÇê©≈ä}=¬LGπ(öd\éÚêÔL*õ0A/Ω⁄:x≈‹Úl[qX/YŸ⁄S– Ûó`Üs·°Rç‚¨ÜøXh«√CVQ∫Æ“u‡¥8£íØìî=ñpJèß∑ækÂY¥@ÀnïöŸÊêY|D*µ>î.˜ÿú‘w{[JteÙÒæÆa√"Üı{î<òë˝[ˆQBÜÜ—Çå∆f”ÍµcpôÂîÜ±h[‹^ªm84Ÿ¢ÚŒbG7H˙”	âjh.üËÀ1¢L8Å·¶fîÁùwÿÅ≈c•!Â≤œg◊n3∑”Éz◊±as›å§£?…4§ê^Q-¡jVy-0Jﬁ—‘°gÖ≠„ù≈ÆÂ":ƒPuF˙/-»µx≠´04∞»=?‹lgTœÄÑ´√÷u2Úÿ‡Œf◊A“ƒç5ÃúY*EIS·Â'¬jΩs˘–ó8P=óØ‚)TßáÓûÌ¥öuªkvÍ˛ åÏõ;Ï»/πîB◊Q∞£k<§»yé2ÈÁ0s†⁄´Å§(Ó≈CÖ^‘'ö®Ë.¸'ã≠(ÒùËqM®"Z„ilQó'æ÷ΩaÔÏ¥Ãÿ©fÇi"M≤Òe§
À]©âá»úÑT}ƒ∆}˙WCÎDÓ7zAs>6bƒ¡©
˝ëqêÜ’∆E ò·Ãa;TxfıG∞	˛fµb4πè +ÖÑeﬂ(€≤ÁJC<o›≈3¡;s´’”eDÊÔ≥åQÛc„jùœØ¥”Î07µ"–°Då w˘ /w# wa_V∂∑#óU˙çn5à?öàX©i°%-]ƒwk◊D)çf®KF†d¡âÀsO@∆'S`.Ÿ«wÎ≤VÅZ§ìà!±⁄T$¨<˛
™·1xJ‹Üc∑Z[ÜÉï'Â˜9≠æë1ï¬Ù∏âπ∞çÅ®π/Â{ÿ,Õ<Ÿ«ÛÁôƒ|Y›pªx ±Yõ:ïÜ§çÈ'Äuı).¯€}ÜÊ–Dª
ÀΩh7Æö<äÈœkSY§Ω($*åd-LF˜N√ÈMDå÷πÊ®éƒÓﬂt†+µÍn‚Ù‹ÅPïàç2Ú<X~≠%	¿˚á		⁄VãíÔõ»i€±!KM4ìÔò”ÅEa!ºëZ;Õ≥ú—ŒèL√•V¸ñ›`:,ÏÖ_a,A0ª{ÕÌ¬ûü†Ü`ˆ•§LÀ~X¢txP(wt•◊'…Z_Y.∞‰≈∞8‰¢ù÷˘Ú§ï_ﬂÈ¡¶¸∏j¡‘≠ˆ,Û∞€Q-¢?BÆ2"˚k‹Ì∏aÕΩn(«”
˝˙∞˚°◊;;¶Ûí—ı¨FnúôH2æDníq◊…‹ÁŒë+Éº÷øuùÙ¸ª¡;∑…£˚◊¸íÓﬁÎˇÍSÑó‰«É5∏äpá∑/˜,Z|≈©+¸HV9òËgAµùÄR»‡É€˝7ﬂ‹˝í‚(¬€˜›ø}gNàÍ˜å|ŒˇÃë+kf√n∑—˜®Ès"¡	&iç ªÜK∂PP•ÜŸÆŸ|ÊJ2Êúb©√ﬁÔ=8æqâ˜ã˜à;o	k€"Ø+yÏ'=1iÉ¬ˆã∆7jÑ¢Ê® ñùõ^q;ºZÆIrzx´Àó=å√1%$±=‚5∑Y,ÃŒ\ñ±üò…–ÓÿQ#"áÕ˜ähG%qõ˚G#g$!@6^(ìÕï‘Úß˜~AxkY¿;iÙÉo∞›P§§Ò‘Tz#CU%·Â+_KpÙPjˆ‚w.ΩÁYùº˜´7Ô‘õü°ÉL±nzÒ3q≈ÎÃxÄÓd¯ÇjK]Ï[àüz&ZL9˙‡q30ètkÎékÊÑ'Ëì¯HºtOjò`Ê*îéò¡π≥S≈ﬂ§g‘ááäWπòÁd,ÎABDP ãñ¶5QTYùfAæKl†∂áO‘¬¸.∂∆kW¥†eZN™<EØ¥®à'FÂ í§6;Y™'À’iåR∆ûò≠=•B±|9Àz‘ﬁ œHK§ﬂA4ÔiQbL±æÔ∫‚Pãπ6€£÷â»ÇôîeCùl$ÂÃ'jTdLˆLŒL	¬*™
·ÿTU)õ‚RYùG$e≈U≠n±e&’)yD∑‰ñΩµu0>ÑˇqÃ≠rO¬A•ÁûQõî÷ôŸõ#Æ»i|k=D>NäAîµ”ß+Ò/ìèˇ8|ÒÚüVTâÃaÅ∞9ÍG,)àV±ãñ†kªö–¡Z,>'S0ªf„„õÿl≠&8-‘jC"JH— ëìõ'øá Ø4il˙ﬁ∞íoíèò«$¥6\eÎÚ „ÅŸÀ¿å*pTÄ$HÃÍú YûëN7ﬂ6Œ—¿2∞ºõ¯ß\3Ç∏¢4≥”l∆./Ÿ{òh`≥6®Ìr∫ì¥òªæÊyGéGìr ù¶ŒÀ·°äVIìúcîéu—ÄªRÏ’A-@[êLô:òÏ¡ycú?b˘Oí $©2DˇNØùéËœ¨Ê®LÂ·ëÖW¨ËAÏÇ:ÿ˛Ü ÚW‘•IÜ:u∫Çº_é6ôù0_!Ê`8»‡Pü“~R.z%G„∆[Ñ0w#4(Òˆ–ÙÊu‰ªeµ`IYoùÂgzZ9U0ª<NF5hˇÍy€DNŒ™;ò¿†¥·ÇPüí∏!∑9n˜<å„Æª4ò~< ü‡F}´Î[∂Ìzäª{¶q’Ï(n8¶ãù”0˝{óÒ75KL–%á ˘ÉŸ00Ïû∫Iú°@ÛÚ4Ã\P„xíZ„œG∫aG1J¢Âd‰ï)Bâ)g}Ÿ0√ƒœÿlíª/≤˚gFW–9
Üô«”¨Œ·°ÓÈ“9¬R©˜x>≠π°JâP+*∞Ú[ñO£¨ònœÈÇZ?]√rË?ﬂiM~‘®h‚ÁÙz◊pÆ¢.´∑Ÿ&cé%•Ì"#Ó#µ`q;ΩùÙ‰Ë∞«¯ã÷sá˛∏©∂ôìu'Ì<W«ﬂÒ|®)Â%˚YfS∂≤"Ω&y^foK”œŸ'	75fÚ‹ÔjzÛf:Rj“I…l-é`
ÿ8ˇ¢Q¯Ãœµ$d.É›®s@S¢µç}´À¸—%◊,◊b|V†2QXòÂæÿu)Ï4Q›È∫65ÃFsË@ù/ÆÆ”Ùós‰¢i¿‡ëKPÚ˘ ∂
≠ëj;``∫ê‚g%?)>j«∫Ähÿî„∏E¥6«‹>sΩ[3∑èî∂|˙ÎU" Vzó∂WlÁ*»‰Öñm–sçÜªªecB4tôQ∑BeN√º®Â*°.˘*√8êÄ®ZD™ÏÂ7À”‘£«∑?l√Ñâ«É•:c>á´]LêhAû'à<Z£™›˝zπÍ€£¶'K3Â…r©Ï√T	<‚µ')÷√gô’ÉFliD–°Ñv:zë]∆eó|3⁄àî'1?Ω˜&;æ;˚  ⁄∑V^ﬁ ÎÛÎ#x7∆√§)ÈÇ†¿öhÉ÷(˚ß©+u‚%ï¢¨∆7–œg`˚L6„hüFJ⁄#≠ZQﬁè"Òqcg/XÆáEI—ÍZÀÒåO)Ùá!jl-Úk¢ˇJ†‹)kŸwIªE!Jh]€i-±áß†∂vbÎÓ±eí≈û‡n”År	lT¸å>W*∂'¥˛kö8Ω]ÿD`ÿ="	Ù%y£ê™–Î~"hMHÓÍ£›*;⁄ıßHñKå§JíÄÔz-z¥‰ÌŒaxÛ%√€-¥≠åUqí‰§	&S§TÑ!Ñü≈â£ÁØË_ÜÖ÷ﬁ¯`∫£e;ñÈ>¶„XÑYÿŒØW∫=€]!vTŒSÎe38¶B-’"Âò‘)B3ç‘G†ºSÖSAW+G;d€ }§ÁtºØUË%≤L"ª“øïI\Ëùô¢ü¨1„ÈJí1HÑë˚‰A˝Í√7†5ÉUs˘>˙›√¡œê˛Õè˙7oì˛€∑˙£ÀﬂÓpC¯ıËã[É˜ê˘%Ãıºw„¯ıO©·ÕªÉ~“øÕÛ/?C-Ø≠´∞f¥qQFô2œ}$ˇsá'™ﬁ≥º]öπcäÛKœå©ºö≤≈(©¶“ó◊óp¥8¬ K Ìfò‡÷ﬂÈlÆWRJ–àkqi∑›E” Mc°ñ˜ŸtBSÛ%vÖ+ö@?{œÅëPY¡j	tÙ’á?˝±ÜÜ_Ôøy›M˚_|ÚË˛ƒ3¯_E3w3"°©“)ë(ÛFSzŸò_%kã»•˘µo-Æ≠ìç≤∏¸‚¸ãã@dmÂ¸ ÜDiP[rjNÙlCá‘¶`|Û‰<UÉ»¬¡ñÈt{ù´dô}GÒz∑IÖ"i’Û®
*xë[ÅÅcT„ñI+¶W¢è%Ë•@QõœñåíQ6/«ŒÁπ'T√±] K
ïÚ˜xi.CÙ©•6L&Ï˝(h≠@‡»5ÿq4,±µ‚Û¯oí<[6 F’$Ùo÷îûüàyÈnŸ˚ÎîLÁ»8u€ E¯ûÌÓûòÇîk5˛£X(◊&¢Ó∑¡"Æx≥È¬Tô8a‰EîÿW`\T°iyF4∏JLˇ•¿y*40_pRm<Ò°≈µ⁄p¬°}∂∏ΩMJ›˝I&∂u¿ìD~v∂ÿ4w`∏µØ®=§√F¨Ér≥Ä°8®≥x∑˜*oÓxJ`ÆkÙO±=≥µÁ'n‘r:ïycW&≤B!À\`H∫Õì;píh–®±≈y≥T{ûoœUti·3<-ªNú˝Í√üﬂˇ˜áo™ˆê§jf∏Ÿd≥‘SÍëë.¯ë4l!–ºˇd2D…¯Í√˜Æ€ÜRô˜µZÙ€P⁄P-b±∑n[Ï¥ﬂµRPl%⁄µh÷8ÿÎÏ=y c”{¡f#/Ùºû∫Ñ’`+Î˘û’B!'Åú‹Û©*ﬂÉπ)˜Ttéôo-€U{dln B¬úpffÿÃº˘Ó4±¬ç9”ë©æâB?lo‚4o‚∂}õú]¶">ùÈ§ÿJ>êÔ|9|+ka+ïúv≤°,∆˘ÕOái$	KS_(¨>âÈfÉL˜O1R´¡¢UTÕ˜üüqxKm≤µM9Èï‘ñœ~›%Å‚¬Öu˙Ñ|°ûŒS'X`6´µ`ê™ Õ.„(©Ë}àfîÑfG„Pl∆[CÔSåäO: zO≈KÒÌÀ⁄AC7Yo<Íyyi»´ú†4
®"&±z^ím‹¢éNe?N"Ãª∂â“ÂÂ!ù)Âƒ‹Æ’·¬@£]‹´õü0áX¿õœn•fÈíZƒ∫ZbP√Tq¬Œ°A∆Ø2s!∞∏t¢B4∞QÏ2v4âM'‡PÓÓUf9BsA1¥çùΩ4øZ__ò_^^\´_+´≠[CI–ÿÎXèPPº!E3˛ì ˘TjFC∆ÁC Ö0‰Q§^Zv◊¡37Ù±≥ùz±T≈\ª3  ,,bËd=æ¥b¸◊mâ=®÷W·Âm´1J™ÇtWgaª¯8˚∞ô,ªKG©Ò§é"~}ÅÆ:Z√ ®S8Øß™¸–*ºÏXf_{è~Ò˚∞Y,î.g@«á∆Õ;éqê+U´Öm´’b)›PF}íXåå–´Ó
m¿sá÷—ï®ØoƒË:ˆZÖ´âÏÜ™¬1^F∞πÉ√¡ÕZôêíyï≤nU⁄]ò‡´˘ÕÈb≠„s{€§/ª–%∆É¬@»Œ1ÇRPæíÇ43Â-ñÏ¢¸/!|:¶˜+ñÓ˘•˙˘˘ççããıïÂãﬂ#π_^\ﬂêaá56ËåsÖÅ¢ÑEäR“w…7‡7SÏoø‚Ã^Æívsé©î˝)ÖkÙØÊŸ°íﬁ&Û8»ƒñÍ™ôÚ§H)M€$Ÿü#yuHì&úçæ¢y!≥ﬂIª©ø˝\—®"ÖO6Ú¡˙n&Â ûÂ6APú*}B·^ìÿ*HDJ§ß-EØt–√Dw@)§≥„ÿŸ˘ó7V8%úÍ˝3˜≤ú“À,H¡™N:^¬…	n“Æ[_3âˇ±“√!å∆§¬ë¬Á–∏èÆÖ=ÿˇé^â_oŸÆk∫G„wöé±Á]–4¯âÕYDëqn‘ÁÙ—!úø±≥Ø¿n∏ï7GZ≤Oòñ\N51dä‰ò;Ö±üÉK˘Ã7cóŸ‹)n–©õò›/DgõÁ„|¬Xxº^◊{¡åß'/Äïò>£uE	}ÄÕ4ê'≥‡Ç¥≤
´∏±C}\Ù)–HÍhK}bAÁ¨˛—£∫(!]JLÑ°*Z$˘À^»”<«ç¶ªzÅ@£Dúè!îfg(%„éÜ!YRßë ó”Ága‰ãäÔûXä«aI	¡Iÿ-_}¯”7»‡„◊˜nÛe“ˇ√ç¡ç˜)NΩ{—†Ú1≈MHFhIÑgQÇ¨ËqY2JÑÀ∆5ãë1«XBﬂf œ~æ»O"¶•É0WX2$Ë>ı˝E!?ìòËÃcc%∑"SR5ef3◊≈ÉuÑ¡.…ì“<¶‰?Ã˙Ä–+¸∞}’'àb≤(®*B[5Ûî£¡N3µ∂Ä∏qïã≈!Ìe*◊jù¯™2∑∆3cC£¨Z‘D/I„Ön˛vYZ¢ﬁ¯-ì˙_¯+ Q∞Å“∆ëI/Ç
¬ÄJYUò¡ƒÕÍ‰(:^«√ÊR›7á§∫≥gH¥êˇ†¿Ãª?5Frg0hüıN§&R’¢ûA[OvÀô0,ôNfQ∞∂¿Ω,Z˝ƒÙ0N(mç||≠CÆ C<º¿∂ˇUÙ˛∏∏ñr(Jÿ!IÈñá0Ñ/Ø.∏$G1ªPß=â˚èW††„r]¯S)¬rdRÜ
Ú(¢ì1”FæQs7ÒÌÇ’§£—∆A/ÏSÃ˙Á9íÂU]Ú¶àej°‰u%¬»‘õê˝Q8üä≥h‡)ıÍêt®§¥⁄(0t&#"‰Í†`aˇË˘+8È]˘∆Å∆5]âº#ïK-·ÇA˛ÖÓ0Àß∆+X€yï‚ùÚ$1AµÖÖ-uVzﬁ9‚MHP’§Ω]´eæÑ+˜ô√g‰6˘CQÄgâ∑OQX]Õ§	¶a†.ò€FØÂ©u¥å™sõ\Ù„8ã≈å55}!Œ0bù9ØZçò´öiRLƒ≠-Eö˛‹Ω+p¥=e«`˙%‚€È7é®°SÇ{Úø∂Â10πdd—„_P@„ˆ*jTé„â~5ÙøBUôJ3Bleà]‚T?‚ˆ∂1jµ	Xö«Ö*| Áµp’ËG Êp√∞Z	¿÷⁄ ˚õz¬‘ÏÅ<≥ûo∑@’B=>¯*˙Og‡,t"¯ŒIp¸)≈K;õXû⁄ôÕñ<Lá™:4≠Ë:T©C⁄[ piGœ/	ÏËXôRì`+8((”ñ§0™Èïd.∆tÖ”—u%ÛñX¸˙Ñ& ì>◊"˛äÜÊóûÃPfÚC;T°SÑ¶å•ÌÒëBuöä [)EÈã´eÃù>‘∆2‡â¯≤Ør–4Aäjr:ßEk—d§Êü%¶ˆE¿aíQÛOrNj˛…Í2jÊj˛I@‚&∑5ˇh,ërâ¯9Ò—NÊ«À4=ç¢a6Õ‘È&”‰úpÙ„´!.≤áÜ˙>%=óÄ$k5œé„2G%>ÏÅzó}UO†ga¡g8∏V”µˇÿ£%ª®$e	lÌhÅàh„]÷S⁄|ªÉë#>‚O%Ô˛PGì™.xBÉ˜5Ã∫t‘q∫ïb⁄JX|ÿ A£ß(j˘(?Í>8≈âëR(,‘∆~êôÜ
9û”Î4Ü“‘9FπS„läN'⁄ÕñQYáT˙+KÍ[\`dÿÈ	)ÔÛï6–å>Mçﬁ$ÀÎ,_¸ìëe`Ç¶cßQ°I5G3T0Oi§œ‡<Ö…åÃﬁ,ùΩaÊ)Æ¿§ÕúÓlÿ±]3_≠’ƒì·’π√YjÅ¢s”Mi/"∞ΩπŒñ§ƒ_˙*√¸jÌ}Ω±≥ﬂ•ı©ˆ∫ﬂv∑„é“Ëa§∆!1â&éT)	Ì4≤∂‰∏!£îºÂÓBˇ0 ∫—SÿÎ<î˚P`	Í“⁄‚Ü†∫⁄$ZÅ"vü¬Lƒl√å6	¿€YLp*∑ÒW—£ä
–…¯€z£à [È±ÿD∆]≥µ=˛L"I∂tâOJg0å)ÑnöÂbKH∫ïÉ˜9¡»y"›∆!>˛‘.ògÒ_â—" ß'i≥» %uYLBz∫9P≥∑E±WV}≥*ºJxªJM«≤Ø∞^’ÖçÎ⁄Ÿo∑:Óô1‘ó@]⁄€€+ÏU
∂≥3¨XD˝hå÷ú´î«xûFˆ7Êı:oÔü√hÛr˛#ËΩç:	FrKŸWaπü*S˛’</≥\@Å∫atÒp∆4r”V◊Ö©iıV˙+ﬂÿ5˝XéÄi8ñ¡G6eßgùtX
ög∆.¡z=MfIÈT+_À◊êÇ¸Ç.kÜu“»‡û+twmê&◊.û+P˜^˜À€Õçw≤œõüH˝D-ˆ$¶ÜóL«Œ?wij–“Ç€mY^nZ∑Y∫¨3FL2•w≤YjV∑g'∑∑õµfmom+f˛°ö0÷ü t˙∏TaùSíÈ m‘Ÿ∞k&ô*√p0bÉ\Ÿö)oO'ôƒ°LzÍ±ŸF≤,ËÁ ªmAsU´¨F@’µ+sà˙ìIQ=©J⁄n*1H”!æ∑ÚrÜâJÌß}Vˆ‘‘?Ys˝∏@‡ç]LÜÙoπ∞ø–≤∫]öΩKùË¨‹
0ªjw{›HÓ°dl1ÜÀ¬È9L¥˘l±R<U*_"íì‚ÃD@ﬁà\ÿ;ƒ·Gâ;Ñ™°!S»Së‘”/°˝2Íàg◊©ÌjÚŸ“vy∂r™é–#ÇxSß`%ä∑ò8ñ¯⁄eZ#zÑÃU≥]«ó…&"ê‰-
A"êò-ò\◊¨OüØ◊‡ü·—_?Ú,àıSG§ƒ§π8Éókj\ó»Jëp˛ÿÀœN	ÃN*Õ€(Ÿ.®+Œf©¨ä˚†˙Y>gˆX˛XÉ8÷˜…õD6ŸW<Ni=Ãï‹À24mrV√(k*Dè°+Õ§e„NÒÒ»êc©T(ßU¢] "Ÿ£ª#ÏÂ´™?0áJ6%Öz0œ4`^±h‹:˙{h6NÊ˜Ω9≤	gi~T¶Q˜¨¬èSe¯1ãàê•"ﬁ)ïÒV©Z-^÷®˘`böÍY¸÷æq¿™“ù$¡oÌ”"¬B°ΩòîE|)˛°¢Ç$ÇÛøIaJ?µ˚†ùΩÔ”qJÅB˚~ä˛¨’.k_†ûNÈ›’µH+Gùc#Ñˇ™—Q™ÕBõ*à≈Uù∆°ö≠MLˇYtÁ 5ˇ—r'o∂ÑdÅèŒL$‘8ß≠±\Å*ßgÿøa+TO£ZˆÌo2Ñ÷8:7*'™,§5ÎUfΩ4⁄àñ ›Ù¨∂È2>(™î[¸RQ`Á•¶”àT0QèëfË¥|∞>	Fµ∏˝áDËÇ*¢Œ53_ié´êÄ0™;ÀvÃ¨}DÄ›-a”?^m›O(« w√‘êàFÇ]6lA5 ∑=á~ 	êΩëú{ï¢2Y*búÀ¿√˙¥%˙eåG§ãA˘ï*·È@ãµHÉ™ò¥¶Xù,c¿DP¢«ç±h¶i-ÒÑV·H	€hòﬂ	“ ±èOÚ∂Æ¡$ˆÄq∆q•—–ï>X	≈iDö£ÄC¯ÅÌ•9ﬁ˚Ûé®˛‘k'!˘HRºcòm[∆°§Z)YîÊ{,J.B°Oê.Gnµò÷ª	*·Â‘‹÷C¥?_c†£xTËüƒ˙'|(§éùïÌMÀE ]ÊÁ©„håHKªùhXN†àÖ‡Äi˛ö·YÔ:®«gßAûÛ°w⁄<◊_:ºNà
,káä)¨≤)†bBﬂL ÛIdó∞Æ‚á≥·éÈav	6t-œ°√º≥‘‘≥2~¥õJË¶≈WõRbπ>+ôˆt?‘’ì™Næw»–L.™Î4I«–ú0ìÅìÀ≈¢	(ùV/ŒoqçîN¿i©◊æ¶-òû≤˚[0:E>˚oπZùúÆLŒVOº˝÷›zÈË=·ç7‡[Dåe"q‘°¶π3Ò€2ù æ-˚§<ƒ∂Ã_Ú∂º∏ºxÈ{¶çQV∫]ªC{.pp 1<˜0]€vX§vˇ„}~èÃ/—»Ï˘%Ú“‚⁄ x™CLÍ∫Ó7‚Èﬁ•ô◊–üaó∂˘¸«N≠*a§ùöŒe⁄NÂÖª7≤¿ ÍÍ Ú‚Ú≤DNÕQ„/Õ_º∏∏¸‚‚ZVfÍVÜÅˆ5ŸÏK⁄v'¿∞‘Ë5áå∆ÁG0ñ_öÏ^≤«äFﬁÉh® x≈	0ôÙ^~ë,È(ΩåH¢R™tBûìÏï¡‚ñaìûL“ƒiΩOîù|£euÛx#C6 ¡¡/°Q≤Å
£TÕ=!i’(¢˘Ú•.q`¢í‘XRö—√Ñ≈3é≠m–N¯Ïƒ.≠+à¯T≠Œ^OÔuUŸs‰%Äâ°5qÿ,*f∂∆’µïçïÖïãı•Â•ç•˘ç≈ßß∫:ÆLbæ$øë[0öóÚMÑ¶ ~Ω|%~âı∞ê2ÜSv¥˚F^X\X∫∞¥¸"ŸxymπP(ú|>;∆©ËåîÒhQ:Ò¶P©P{(emeı{£œé ¡5Ò@,—ŸU1◊…ß—))ñ‰ú
û¬<]J“:}Çxóãò»xº∑Bu<]É∫11=0zR©6R≈Ω2ßîÍìÛ
™ÎCŸa‘¶ìjhÓÆŸå◊WãÄ)GN`}s~©Ë^Nhïf¶Vz8≠/ÇxJ–©t‘Iíé‚Å˘BûT˙GÜ≤äãQwLqHzNcPË&vc–◊å ¶Ùwa:viv‘§>n	ßÌaøRv]ﬂÀ»ƒ[éIìUÕÒŒ\VìE°6,](°™q"/JXﬂ£Yy9¢J›#aKàH ò”@É•ùòß-≠;a“WA!H<IáΩ0˘$]@ ≈sÌ"=ÿΩKo„Ù! ûcvM√õ√`îv2∆πXƒ›ORA¢ì»˜Ó¯TîïSÅ·˙ô‰8VÓ•˘çÖó.Õ6‘$ÌBΩ¡+IP+nU⁄ç‹e?Q^À∂ZzÉ4M-.”ho©JK∞:‡8õA?_ˇﬁÚ¬Kk+ÀKˇà"Õ¬ %ra~c%õ-G£_\ôß"F√∏∂Ù›zq˛˝;´kã´Ûk¯÷Ö≈’ã+ﬂªTrB÷Q\åH6Iiø%ÃÙwÜ«–õlÿ;;±XêCﬂÅèÜq≈x,H™T1Hi≥T,^N≤´ì˙&;4—∏ªˆ∂ﬁÔß&ä%Õ?GÖÃı›¿·i∂¶[4¿»¨ﬂóI˜≤ÔÛ4Z’ô!ñc©ΩÉP64~Ès{SM±ZîÒD–ËNmê◊ˆ.sÉdká	ûí√˘»‚u¢≈™™PGﬁ!É5 PkFŸAa„’(/Z-”Z∂ÊV¨Øˇsœhjıﬂ·ÉÖÑßÃ6\)äˆ.mª÷ÕFœ¡D Á∫P‚°YÀÕZñv2%O$√'Ã≤˚Ã§ã©ŸÅƒª’⁄24÷Í[]¨ºó·4'â’‹◊$ à¥à¬l¡≥GQ+ei¡Ÿ˜0>œ›9ı*H÷€ñ„zsò§ó†pÆÌ¿_Ü€Eá˘Õ⁄‘)=é≠ç⁄uÅpìÏ∫¿∂‘ôC¸ôh Üµ…Ωh7Æ"‹!∆®§<¨µhÄâØpTº¨Ñêé¨ÿ‰”~9ßBÍK…&ÄXi…[%}Çóß√Lë∫è‘¢z)¶Oo›àã¨fŸaªÙÀ-Yÿ›rœH€ù.MrÎ€˚πÒ ≈Ö≤‹B€⁄øjyÖÜ=≈0XÍÆg;∆é9ÂnÔOïk”3Ù&4∆≤Ìne\UÅ™?È'ŒäıúÂ¥e¬≤p'jÈ|¢¿ˇ—Cb)A∏bYè
ßÍ#aYÇP“$rÇV#±î<ûL˘&C|∂VH$œo9Ä§édˇUÒjå reD,Uè§Ÿë;Ï€∫˝à –MÒè‡Çë"&{AAñ÷/-≠Ø◊óñ7/“Ç@L˛Œ“‚+uﬂ\ø∞∏≠ò18`ÌdOÕ §≤Húûäµ¸ùûB7´yf„\Ú[6,–cÚvÜi”#¬l$˙d∫hî™óÂ4]å∫ "ó®œÉâ˘‰GúÅU3UÖ[ízÇ≠áŒ±‰k–HÚäÔ≠Y›.\X§û)ä$&zâ˙–r±&»b¥N|VäÕÚ°çÂá‚"∞¸Ñ84≠o{ïÜQ®É(RœåeØ°JâıÊ©ÕrëÆ<ª¡_úèÉ‰næh#„¬§√ûwÿƒ˘Q2
‰€5 ÷˘Œé9\¶ãc°˚I`Â∫@£O»x±Pq—â‰±6ì˚ﬁ’ÃjJ3ßÕTKBËõNr@¶{°ex∫C,ß—kÎQ‰-öO(œ9í¡«OR$Ü¶Ø|Éá≠_µZëLnáRDÓﬂ4û∏ºá|e…òåM9¬«"Wp•aRX˘íW>t≠ê4sXUô‘^®≈¬›æΩ±»∫A6¨6Î/…ìéix≠“§+¶¿Úva≥cÉbP”)LÓÖÆıêÂ≈Ô,ÆQ&l]óÏYﬁ.°k±ÂFπìÏ:„„µWXì·BÀîN”F±6ùèuàR≤c¬m‹Å»é§≈¨€Û^ÅäÌΩ3áï¢|€Ì5¶Î^Íµ<´€≤P&,J“C€n¡˚V«L¨êlÚupNª˛åpŒ*5Ÿ]e¥r&Im1=?ëCÙû›Yg›	µÙX)´¬"º
¥ï}€3√—_ìÖHxü5º∆.œ íC°ì*qqQà«lw=≥9á˛Of\à„3≥Äà¥sK*àóù:˛*vakÁHÿ\˘Ÿ£âXåfÛ¢ΩìÛr„ÓA«tvÍˇÏÅ8Õ*ü$˛†NíC°`±í aLy*ò$Pê›îÓ#yZ^0¨ñNk–ÕÕñw≤9((Üp|S&'ÛÿmCøÃ¶0t«d*fˇ,"+1[Åø¡◊h•4›ÚD◊AIÈßG\®ÂW™”s§íÁK}œŸ≤	ÖsÊuÂæ√ÛÒÃóJ!Ìúø<-©õ.øOrbü@›Ùhõ∞
⁄‹§`Jç"7FŒóî^ì°´◊ JíV¶≈ï≤ﬂ®ß°ÀÖ£“Íøát&ËäXŸWá¨1’NÙï¸>%'Rı—çËC3=![
5ö°¢ïÂƒV≤$ä—fJIŸ◊ä\ê©£Q#±dñSÇ•[ZÄ¸,0UV†+˝˚˜?˙1MÙÓù9r|Á∆‡ÉO…sáëﬁÀ†{––+ÙÊY`¯0iodPåˇëÊòV\ñµb5≈ ±‡9te6ÓU≠∂ÃÛ&i´ﬂ$ïÔ¢Œ˘r]Øl¶Ùò\æ¢qAT'»à¡∑ÂÏŒF∞%Á˚ﬂ«ùaIXÖ&îÀP2v˚N,˙ƒei9À≤ÿ“û¥Må0hå¯ÄNh≥ß≈ü’ÂN;"&B `±π—ïŒ\tÄ2øc¥»Úå∏±Ëí¨I•Á¯Î⁄§l-&\gV¿óa∆aÑM«Æ#·÷ô‹_á;®/¡Ê˛ü÷WñJà!(_◊o≈’î$£YÚ˙ÄN_™¯{´ΩJ≥c™!)xEÜªñ69œÓ5vÛÍ%^`˛—ƒÆàS®ôp6tı∏([üÉxÑM√VDºõà∏Ã÷¢õ_Yp ≠Mñj3ì%?¸Ö:¸†_˛

õö—û>D∂•Zñm)j1]@Ÿe¡“§Õò≤(ÿÃ"¢ÿ9t	W§º|pªˇÊª<Ÿ› 2…øˆ†ˇ´ﬂí¡Õªd—O˙7?ô`!/o¨–˚óæE‡À˙∆ Íƒ¯s6O-˘Ö¢Eﬂº;¯‡'b—¯ÄPˆ¸⁄ÆL·ã®g-å‚93&¶@f´Q∂∏ßœ€ûr&ŸÓZûN;©NBl∏)r–FsIì4Ò‹íàWÙºi7√≠;A‘¡èr’>R∏ü†Á1 ≈RÄZ;≠fq∞Ü	¬ÍÄ&≈aJ[ô7ò^¡Êúe¨5èDƒiù—óû∆Ã "„G\fä“∫0]0µó5 —IQ˛¢å<6Æ*Gü› √‚∑tVR6›R’°äñ6ùdπ4+'kãqc‘ô
ŒõRTòÏMLÚ‡_-1œzü)˘e¯™ ı8	Œª|‚TS"skï⁄â/+∏“’4ï,uk˜W~Ù3YfŸä}¸ˆùGÔÛú•Æ‘ÑÆ≤Ã?l<ûá?∫Ö\Q]Ω„’¿¢≠'3hsö”òÂÖ∆ãr!bèŒ≠—s4≥IòókÎÄ„∆£óYO9ÀVã√úJf®qÕ∞ZhÀ‰ïú! ÁÃG/ b/ π“{æoÕï9·ü◊°]Î¢º≈Ô»Ø£∑àã.5U*Bd/zôÒ[6¥r|\I#œ,v¥œ,A«·Ê-xLuøÅ è»˘ºŸ.∑gyç]‚7W%·S^)Õ)àPÍƒ£˚oø˚9~˚ì¡çﬂ≈ZyÅıhƒW4”EÂI›£mãt/z¸5Âß“°ÒIE!3?hé	o &l9¶q5~ÉéJ9√®ﬁ˛7ï¡ΩÎÉ˝2À®ºıô¥C∏ÍÒAπ 0L±õy\ÇX`_·`dò„M%√–Ù?ø>¡¨ÔZ€^*µ¨wÁjÀÃ>0·9`04ÇíøˆXÜßö}x≤SûT¬Å«ÃVì˙.d"Z–"~)2D¸⁄c¢ZvÊB
∫˜ˆÃµÚC“mPø<Õ#4=‹¢úmÑË¢¸$ËÎ[ñOe°úœﬁ8¯¯:¸‡µ˛≠ÎÉ/Ùz7óÌÅÏπÿ1€I¥Fa1{ô«'töÜà_äåøˆXjf®ÅÍˇÀÉ!Gi”<÷A
ícƒÆDÜà]:Ÿ≈–¯ôÑ)¢Óú!*\æ9qTb≤ó&yØË@Ã≈≤£«k¸F!öñº¿˝‹M^—eñÜFehÉıc–%ÑEféf{‹‰IMüât4¡∆t—G:†⁄6üQñØ*›*[)ˆ›∏/ŸKˇÏ°f é‹—ﬁË£µµ'¯ëNx∫€}≥⁄9’&…\Ázoà.u∫ß≥b5;©·)Î∞ÊÎãuhv–eñ«œ3bﬂµO°nÆ*	è	y”˝~*B•hÊÓÿˆ«ﬁ”√⁄kÁêõÄÖ≈e8¥§”t=Âgç3ÚY„3≤Øe†õ¬™U¬cQ„ò.%úÓ®/°wOôÂâE˛%†`ÒN°ìa egó»˜£	≠[sx∫´Ñ‘˜Ôav(Í∏7œúÒñ`uzÏÔÛçÿŒ‰-Ã	JÈAˆI¸Öi¨òNàö)æNWóVWÃØ°ú·8;;À√·û˜£·Ä¥TYªÑ∫í]g’'b1ø˛Rsa‡ìê‹Ö‘ŒÒJxéóÑG#7√LÒŒlŒUU¬¢∏`Éê`3“é∑#Eπ(˜<a–2J36„g∂]®›üﬁ˚E6V◊E˜	—¢A,,â`Õæ%˝…\JÖ‚=™p◊=‘'Q∏T=„òVg€v&{LcU˜r„xªﬁuÏv◊´[∞î¿~+˙iÏ‰“ãç]T†ƒ˜Tvoµ£ã ÆëÔ$…Œ5Ω˘H◊ôüdb~ÅHv:ëÓJÇ≤°F˘≈	5ndÒ0Ìt^ÂP‰·ÀMz≤ÉCòÇÜKz´æÂuíÜ^-`ƒ˛dı∂≥mZY∞;€ñ√¯	ç‚…∂a /ÉÒ¿YÁgã9l/ï Ä>9ïM5a{—ß˜P%˜òÂ1ËqóeVuv)õGR©⁄0v}~⁄Xxªœ-àÀ—ÕOÛ}÷”ΩH6&ÿˆµ^wæ Ï‰Ù˛_,îq„q}íim\{⁄¶G√åwÒ∑™Ò5#w.Óœ©3›Ê‘∞%/∫,π©÷t˝Tm∫Ç5⁄ì)+Ùı⁄´¡}QÖËüﬁ≠ƒ∂>TW5Òõé&J_ΩÛ)Ob}ˆoèﬁ'Ô—në„wﬂºˇêûøR‹≤˛Ú⁄⁄‚ÚÖ≈5≈)ˇÈ©›ä¢q<4ÛVp…m…ﬂø—hã@∆÷kv‡±¡Ω∑˚ﬂ&¨c˝_~…˚ÜGÀüﬂ#˝πÛË˛ı¡Õªè>ª7x„˜˝õØ?˙‚÷9í;æıIˇ˛˝˛/Óí¡gw˙ø˙¥˚Nˇ◊˜—CwpÔµ¡;∑Iˇ˛ù¡ù◊˙∑ØÙo~4°ı%ûwLr`˜à€„Ïè`D_“Ω]À6ÙªÁÑŸÌµº9r—v›	 †¸-ïΩc©*:7.¨«ví‹∂"üRïéÖ∆VrÕ¬uYâ˚¨≤D∞äÇ  ¢!∂PF†vw1AmŒ@Q°c◊õfÉÊ¥Dî«®°úLùe"˚å®Ω[ìÊIÌIÍ[Ò,èº‰0TEÛËìvNq`(IÚ…d|`œSÒ∑H;t√R‰§M&§p˚®¬ﬁ°ﬂ@4P•ò‹ëùÙL∑n4f◊ãë'Ä!h/5ub⁄ıå-•]zé›r…y√ô£ßê '…%≥”õda@ÃÁríP[Õ$Yç¢&≈Ù•ÖÇRì≥XTÇhPf¶òÕ¢÷+£D£ë=h€7[àâB3¯…1¢°nêö ˆaøßp¸Œ_≤∑¨ñ	˚¿N,Ç3ìπ†ƒ®¬≤‘⁄_Í∫ÇNGAú§⁄≠^ΩÏhñÓ≥Ø*G^åtWú¨ü‰⁄î$è£Õm/Í»°¯ˆqÕñOôŸce’∂',M°£jjTXFg¸≤¬ﬂG¸ëó£Ñp¶q&T˘û{8ç1qQp±±å8ö„ÿ{ú•Ë°BÌ(&zÚÛ˚8rÄ⁄uDN·l∞‘yjFv÷±¿_$µ
y≤˛jˆ◊oıˇÀ¶Á¿tç@≠âƒHüI†“˝Î!T∂◊‡V√‡ì¬ÔOÕ*è~CBfÑ˚µ[‡◊Pù"ˆ>2¢*ë^å\çEµë´⁄[·t¢Ç@µä⁄“‚[%Ì´íA˚öâƒ‘¡$˛„Nﬂ†n?˙#37ÿ±·ôqà“búπa:m´c¥∏3cç[|®<ä”úJkíœ5¬»z®ÜµÏÂ€π±¶+çÊFŒ†«?Sy¡?÷çZiz;;ã30;˚MwÈv÷#âtTöä⁄]ç¯0Åz~âB¥»7»rm√gv/–+P°‡⁄≈„ñ≥}5G€í[Èö7x` øÕ˚ﬂ ∏8ªAt7Ë9†E≈‘ãRLpñça…ÈeÀbPaÿŒßLà—oËSAƒòo≈âˆäGë@mP‘„;DJxNÜÌ-i#Ì,˛¥$Ü°≤¨O*{Êc‹9§»’ëwèX+œë+¿N˝ﬂ|“ˇÒC“øˇ&5Ÿæ~èn|4∏˜6…1lÖ9Ú.^[\I›)∞9d∆Sﬁy¬D7î?Ω˜÷ø?|ì<˙¸˜è>˚ıÒù∑˘⁄ñÙv”‹Œ6yt”œÅÔ˜Ôˇz≥¸}(ÙgÏ‚√˛á˜o|4~D¶†U™–:≤≤	c?ö∏Î¯Ì∏º–‰¯‚1RáÁ7æ5bW/,æ vÚ¸¸≈!ªó∞ÈèA7y¨∑FßÈ˜7ÂÃÈº≠Vq-IìqC§∏X§Ö[YÇ{QÏ≠Cœ’hÛ$ÃQLÃ“∏dÑãÊIÂˆ›9´ÉFÒÙQπ"™„á2b⁄ùPãøY«iàäk”äëÙ5k˝«{˛öÄ|¢p/PMD*ívÆf¸8hx«FLQJß5˘H¯§2^TÇÚ@®»6÷SÜC±h5¨»ì=ÁPúr§#K˝πı›5≈Kug±∫∞˜jÙ¸Â1‚GçQºŸ“L©äx≥ºŒ∆ÅA£/hˆ-Í≈Ä“≈ï‡1±Å3~˚¶'K3Â…r©ÃuÔXãÜÖÚ’ÿ¡Ônﬂ˙!ºÛ‡—√˚S˝õˇ›∑âr4æ‡–+Â≈}3˛B∫‘ÈK¶ÎBÀ»^
›µ]œ±ØöØXMo˜ÃaπÉPâ! à‚–˛ﬁåÊ∂’jÖsR÷Ï•ô õN£:∑‰cáaÜcƒı¬ßf	#è©nã-≥MÛ¥6ØgÁ€=XS»ÏÕ"˘“À|M.õNñ’ «´jfpÕOó˛™Z#YëÈ|ã6d=û@s{‚ñ„¡è~<∏Ò;å«É_«?πKéØˇû†G…˚4Ëåû]ƒËË≈û’4G∞kIu©KO≥p1ﬂ%üì+q˚ñœâ
ÛVÈO∆„¬ü¶C¥'¨/©≥¿?¡£jıyŸÍÎ‹‚≥iÙB™VΩ1ò?4≠?1ÌtÊÕÉü_G'.‘Á˝ÒÓ‡ãw)—ºd∂∫à[ä”8¬ôÕ≈∆üçÓçµ8ﬁ∑ﬁÄ©¸çEYÍ‰ëV©[¿∞ø·	‰_ü∑o-£∑Ø`Ö.‘‰o«∏L}Åk‹xﬂï|Åi^A:˜Á‡õÓP„C~ƒ[ﬁ›R˚-éÑJÃﬂœ`gÜ:ÉÂD}s√›œ˜ì\s”íO•,/-Á_úø¥H.-.ø¨ŸR:‡j‚j¥!æjóO¡ô!ìª'
_ÒS¬Ä‰⁄8≈√3Ó®9äÉ‹ÈÔ
ì¨ùMˆÉK!Í¿y[úÖÀ∑¬&ªnzΩÆNqjnù?c3¶ˆÊÊ®?nÔOæ6ÒtH†ÄT£˚≈t™≤£?Æ§≠ÙıJbyX7#a≤'uÌ<…ÍµuOwàÕ`ê U	à⁄?d◊¥0¨d®X@-ÈÛzµπÕíîÈ+—∏éüß¿¿Œ:;4.‚°íZó“3∆!”J2Û◊ ùöﬁ3	:T±pÏÓCÛ?AÆ†°…á¿’l ˜¯ë—Ñß≥Â&˘¸∞œ@¢'[‚¢pı”iz:êzf?Œx§‘ú∞:2 À`Ö¸‚^ˇó…ÒèÓ=zxù-ã1H·§ı0aELY©q.ät‚RT3,í
§W~T´√y’ØhI—.≤ó>˝5À@≠B¯˘€ïÄXä⁄'-˜ƒm*
&]?K‡–Gü›|pÉ€|òr„£˛o~HiõZ[∏Ògî˝9Hz3Sô¡ß„‚»ù7◊3´◊)h®Â)¸√v%À˝£—$D¢¨ D…ÔÕ∞}K∆DS∆tí∞¸◊%ükp-∆Œ~ı·Ìˇ/q;H Ï˛o>ºÒ—Òç˚∞Ì‹¿ønﬁº}£ˇ´O?g{Oåüê(.¿Hˆ∑±≥õ+´ãÀóO∆Tµ9≤≤Ωç«
dqøk6È$>%‹6ËIpìŸ6£’T≥ìSÊß‡%Å°¸k;ıÒoGÂ®¡ùèéﬂ∫—ˇÀ¡˚…‡Á∑1ú¸„•8>!fÚÁKÊ¶’˘çµïã'‰ßŸ9Æï[–äKÓVO	;Ì‚ÕzLÊã±ª%3A`'vÂoáô~Úìëôâöà›øN˙øŒ6*ÿõ`'¬øˇÂÊ÷"„5…,5ˇÚ⁄¸…j∂eÔa‚‰m≤·XFÎiëıh´Xãû'qâ\…J¸ûÃK˛+3ÒK;‹ÙŒó#s”Õª˝{üﬁøCéR+˛û;ÜE®Ô	Òè‡a†ıÖ≈Âç≤–©9≤n6ì∆º¥ª‰ºm_}Jòàµã6+√q…ÏI—Èzb\Ù”ª#´L_‹Ë√Ü4xÁáÉ{Ø—çËü¢ƒ˜á◊(3≈Ëk›é÷7Ê/≠Æüêõ*sæµëÛëç^'
£!î¯Ù=é∆K4;àíïËôìÿ„#—+|Ùß˜ﬁ˝˜áoûL∫#ÉèØæ¯$«ÊuÇøq∑Û}ﬂ≤Ü‰7øƒ)	±Rê"F‰§Á/ù_y_Zµ]œOó}¡Ùh&n¬ìÇìth¡noy¡4õËf“§ï¸l⁄ÿr÷pﬁ‹D_‚'(˚’˛VeøÛÜ≥∞k8^Â$÷ÏdŒÉ˝Ô2¯˝›G¸íÑgÛÉ˘Ù¯Á7Hˇ77ﬁÁI‘‡9ëñ9M|Ω""lj#ÔiÈ^˘‘ª˙©·ø°\˘Ge?Í≤≠dæ¿Õ^d=ˆ∏¿xÙ¬_€E˝‹<ó‡ÁŒãH‰8Ëö¡ˇﬂTDxœÔ]ÑÛ–À~∆˚s0N61¸<ùÁ±5•dIº!ãùÙaÅ!Ò˚Sr«∫U1ìXãíxKgèﬂ¸Më(óè{=EÚÖÉÀr,+_W:sfFAœË ´¶	9nóN‡Yª≈9œ6∑ô‹cÓ©j}8å0\hŸn<NIw˛∏@"Ÿ˛ãb®Pã∞—"!åÑò"´F«" B¿a˙K
à„R#2DT(4
¨Qâ¯ïô‚"$¬PÜE‘ûL\Ñæÿ!#N#YñÄ“PtÑyù@—ãìÙø¬ÃÑü—_ÂÃøõﬂú)^€ew‡Àtë≈…·Q[‡[ÇÀ¡6∫§Ò†9¡^ëê#9‰ôÂ%”hF2‘Û&âS∞O—ºCíÛP¶à√Hï	G“PÖw(⁄Ã }§¥	˘Kƒ…ÔY#ÛI `Â¢∆	P/öÈùıT#!$WB»à∏EîîÛê‚'ôlµ° ‚^;~˜◊4mpˇﬂÿI¬¸¬∆“¬¸Eûmõ\\y1ŸUqxèƒ‘5QwÓÑ…÷ˆ>Tv§CøˇµÅ~Æk¸ì<u!8ÙN_◊√8∂õMt—i{8TzÔLe'éo<Ë~É©~J˙˜Ôˆﬂ|wíÙo]Ôˇñ;Ù˛'†ù0Ø7öìÓ›Óﬂ˚¬'Ñ…ˇ≥lÙúN~Î Os>“l@¢÷ŒéÈ∏ì§i¥±Í¶µΩﬂÑßa8¯£è+2˝äÿ≥ÀI˘øF\T4ë_'˜äá]˘ENQπÕÀZá¯ñ˚’:S:
éŸÜµMÚ†®òé]Gö¨∑†àëΩ›Âd;√HôIQˆÍ®Ó—EO¸ÙF!2x:–‚Òªoqa‘4MÖ>¡ﬂìC’∫I°nÈ2æ<∫è5ÓMÎ^ü˚ñ4tÍ¨Jv§PÊ ì_¥\/É‡¡·˚¡ÁÄâû(í
·t–iP◊€y∑·ÿ≠÷ñ·D≈î™jπè·Q"QÈí¬ Õ⁄e;QT:K™Á#€çQ4ç&d≥≈U˚I´)∂®ÿ‚Á¬äÚÁê˚[Ô˚∑ÔípÍ#z(˙#ñ•Û£Â¬eDe™Ö· E≥Åqìò^aÑà Â¢ØÀKÃn€ËÊrP?e[}¬_Õ(–$≈v¡jû4„,jS¢à…Ön§D6˙D$FKDw63Ù’ıÇÙ˙\≤ÿ¸dÀ∑`%Çôˇ9ÁßãU%–‡Q~zåà+@´mU%=‡§êÛ%*!â˝œú‘˜¿ÖaHÏGBOB7
÷˚ÌM(AF]'z$ßÄLÏRºS◊¨àÍÑE∫%∫≥éy¶—í∫Â?TS∏˝ñí√‘m∆–F√KkrB£ÖH ÷f’â°ˇT-Ó¸ü°Õq|“ô‰†∂≤æLÕ¶?í“‚O¯Î|-ƒA!›düêÕ√éπG.@ÉstN¨∂È¢3 D¡≥/¢ÄinXò\Aù$á RÙúRyéP˘eí~Ö•ªúá∑0G(∏=œå\ra!Ô4ÖK‰h‚ËÚêvøßÎÛ{0j0iˆ°3éû^˚“Î◊⁄DÁÒ,õ
îEùhÛÇm{CYT*Q≈'Aosä/âó¢í∏ß®ﬁË¸¨/ØøäÜo6]ÏÏ†∑˙µj°¨µü	
ëIVééPU–W‚xA;"VPÇr>QTJ˝û:Rn•—Ï„©«—KO ∑ç`√,=-„@t>÷&6ßIê §›ú£Uin§ÕZÛ47ÁËóiL⁄KsïñŸÅ‘´¯pò61 X‘ô∆±®ﬂßÀy«Ï4îÙ	+’ì‚˜Å¿ÙÀ‹Î⁄ ¡3&Ã#+›Æ›¡S‘óåNsí,0∂9o|[Ö˛¬7º%˜⁄jı±zÛLÄÕXÔò‚–Ü/X—æ…úa[f˙≠u˙I'aâÕÔ¬Ú$àx∂∞p’g‡t7æYˇqÑJ4∆Ùo]'˝ˇnÍ¯÷'dpÁµ¡;ø%9n±ÈˇËøﬁ@Û~¸¡‡˜…‡=8æıÎ„7@k˛≈˝¡Ω∑£H¡ÿ|¯Úòa	˙≈«|L'ÒÇVƒî3f≥√ìÃTD¡π8Ë_˙…CDÈªfπ÷L˛^`ˇ€|∂∏]:U6Ë)«&J ‘¯íDÓŸíYû≠l’a%ú§Dÿ≈ÈÛ˚ƒe≤âÊ˚∫H‰Q√ö£“˛0?AE∑˜Ûæıp'ﬂhY›|◊h¢ÄÆ ˚Ì∂U`ß‘∆ ",öd,HàEEüX:ßWA»†°ÂÒÏ£H˛:4qŒÑògÌ‘\H¯•¸E\∆◊[V£Km™3ìcá‰æ√ï¶¶È√æÃ‰^ûÄ?Ya’9r	yû£Å∆»Dµ>∞å|ï¿>% Â˚Ø¸0Å©x°Ï/ÈÅhâ}õç
I*Éì nL'àgßêOÿ±:ÓÙ"Å^Eeµ‹@“äÚõ+´´
◊âx	NØÉã_6gäº≥¸{©} *⁄Â]œüﬂsÖÆﬁﬂˇ>_\^ºÙ=ïΩ]„¿Èõ"∆Œ˛Ô?j^:ª±JAwéTä˘=◊t∆»u¯ 1\btPﬁÙå÷*.ò#8	€@àMöh–_W6¬G0o∫µnµ{ÿ¨fÙB1î_πÏ:°Ë©44n«%œ@CÉ ë≈GË ú+ßcõÒ(É®1ƒ‹8˚’áøy˜PnUñﬁ‚f)~èàS*ŸLü„#ê◊X*=∆Ï~{êˇu'œ
É«XªÖ`·˚îΩ%Ãpuäôà@&ûhÈ`Ze(÷D«ïóŒçôD,WÏd3&öI ‘*K?mh\HıÀtÄîS±4=ötí‘Ã°0•ûh°Áπ†Ë>Ü¶ˇ‰ÓÒùxƒ”ø˘	9~˚¡‡sB{π”∆Ö‹/r|BGØ/è•7ã#6=J äú˛l'm3∞J„~D#zÍ,‘≈/'<>æ"!0≥3œÃ√Hªÿøˆ≤ô4HÔﬂ¸Ë÷£ﬂ›ûW1t\êT Ì÷ÀÂ"∂iLÇe™ú≈
$4&çsÆÕ≠ÏQyîm©—-QR,H€n¢Êfw/vœìs˘+?
›Ã0€†≤∏’‹W°5ÿtùfƒÅ	9√ì„òÕxq©πO^«5\ºµénΩæÏ%üòI_ìJj±tzLOn∆∆£a8~;úw˜Èk{æ'»fm&∫ıO”Ô03—†µ|ß˜∑ã©Ç6kSß.´Ä~ÛÅÃ%–JFX2
Ÿ!∆¢¶?{·±Wa∑ÀÑU/ô ÿ∆ÇC/Á`∆&È‘(^U:QM 0ßyï;OƒOH—xOË–9t	¬≤OÚ⁄"Oó
≈ÇéG*ìG‡…ª©he‹ªKËﬂåﬂøIagõ#á3>T™ë#U…·Xæ¸F¸yXB[ÊK∏¡ÛYFåé¿CV¬Á≈Z˙∞(,Lî…QQYä‡cAˇ!·Çu’ÑGûÅQÄ˙É¢DIŸ˝æ8hﬁˆ;qÊpî'õ0?EXPı=⁄\j”ÃÏm	^PU
Û:,
¢à'W¡’≥ñc≤cü9§π¯äƒ
jÆQTÁ™)ÌjqÉOπ@]‚ﬂ{–ˇÒ}Ósr|Îvh”∏{oŒ˝„∑Ô<˙ÏM≤uˇ9~˜Ì¡øúH0^)≠4…Æèæ	É[0|uuÛŸ‚t—¿¸ ¡ä≥Sps3Äîπè©˝3"Í™Yg'E1˜¿ŸX¯8".⁄†X—ÌêÆÊlU/„N€Ô%¢£ÛÅÑP#òõM±˜L≈ZeèD…O4ñ…<µp‚û”
˝Û˜ˆˆ
Ç%9Ù*4ÏˆT◊ÄÔN«ùÚÏÆΩ„››ÉB∑≥3#Ëül≈ÈÀ“Qy¶V»V%≥’≤∫ÆY7º:#íI:m≥≥ì•by≤\≈æ‚ÃDΩ¯|ƒËt™¯¸ƒHı#\å·Ñı+j´L(m\ìÚ´≥≈¶π£jÆ¶ fV£∆±
«GÊ>lŸ˙bô	»Ö¶&ç'ﬂ›'Í?°~rÕ2ƒ(¿
;¥»⁄4C}-mê§tP"–¥Ã˘KvOjmôµMÂÇÌ|ü^@¡K”p4Rı‘ÊvÖÈò.∆ã:¨†ÇG-™î∞Ï`M˚™∞ÇPaI=<Ø¢IµúÇÉ0Sô¡ˇãÖj,ì§$xπÒn0Ä„ìA^¥ΩåU/@’πâ#ri~c·%í[^!kã+k»°ø2øva"≤©œEË\Ωÿ≥ZÕy
‡˚µLV`L∞≈-ÖIÚœ9[µ…ÚÏ‰©r∆Ÿ⁄¡!¨3‰:;/Å_ùéÈ$Ã^÷˘YΩ÷•6_„Ö¸$ÂùZ˛å”#8…db¶k›˙a8EèenØ^ ßÑäW†9N€p¢0,âISvD–YŸπBt.Ös≈Da..î‡¡cæt9&øàπwµ°,	)>]©PNåg	_5)|+1XÖSÈYûÍµòéQA^ ’ÃˆeB	ó9QvÏˇ  ˇˇ‰Ω}s«µ'¸ˇ~ä-á`DÄx'â•¢HH‚Ü"y	 äóÀ¢Ü¿êƒ
¿‡b@ë4/´ÏD…˙F çsc'rVv‰Z˚∆Œ:µ≤„‰⁄˚$ıTÌG…ü"Xõè∞}∫{f∫g∫{z@ ◊ﬁùƒ6ÃÙÙÀÈsNüóﬂŸ« ¶◊>Ã*ûò÷6bÚG0iÅï»€ÒÓ°ªŸ€Î®û¥‹n´âoÕåé≠g7¬ÖU˛Ï0—âTGÁÆÅÊ±XC7zÕÜÁ¿N¶»æ!5⁄ÖßKÜ“Ü“‚Ñed\Á§å(p0ÕD≠“>∆©mE8V	≥Yo[ÓΩtŒãïN[ŒæºY¬ˇ`›∂Dˇ)õÕÇÚ*æ%+”fU;Cmå9®†uºCäŸçÒOá˛O‚/°Ì†2t∆Ò¡¨k[˝
ZËl√Œ<G6ﬁ 4BguDìIóp	ÖbÆTJºÑö«‰KË`ÆƒÔ…®*qß—wP°ú´†µÂ4∑|kevn¸¬KUT√jSˇ>ù^]æΩ4è´ÛË÷¬‹Írz~yÙ¬Ì∫6ª*ÚÒ¿ççô8¸]∂Am†πà„Ô¡Iúpm\ì`ﬁOÆg$m7ê4©AHMS¢ßpª!F
Ö|Àƒâ›ﬁÇ∏¥p•,êõÑ≠–ËíZ›ÈE·%ÃRH%˘ﬁáô{Qö+4re˝’Â€äÑ˛H;ºOp£ã¯-S¸ñíêä≈è§‡ÈN≤Ëæ#*P÷|GslT‡I!ê)u3]:¡DTÚ%˚Œ§$≤,Äèƒ“–x	HeØ˛ûã.—Osx
˙òV:"({¯ÎÈ4˘ÅÏôfΩÁ§Á	R∑ÒZG◊V|RÍHQ;d® a⁄¶õ^V∫†ß@÷BÁ[ËK=ß2B·)d2!i±\¡fQîUÀı‹≠~0I>?æcíè/ë‘ª‡„j|öàVï rÖ//ëã:’µ$&Æ†uÑ∑Ê*ZªΩ∫Ñ6.K≤:TY¯µs›=Õk˝£$_°ûΩìÑåË^jˆ*›"µWn†‘™≥èÚeƒï4Î"ﬁq¶¢W%«
®>BDòªóÜ!H}a@dd5ˇÏ¢À3(Í◊ÄÎ™Hå”b)Q§1ì ´®h≠´aÌµG≥◊'√Åg≠<}˜‰ﬁ{ù>¯>y˛ÏA]<
O’Ò‡ã7Ô‚ﬁ›%ÑøHÔrÔ8ÖB’7√Ôßx·w…øcèÑÀ8˜
˜˛éËÆ	ZN≥C“tvÃ5Á`f$ã≤‡KÃ+≈Î§BÖÙ7LÛ∏Öú2ª†~®˚µ732ô)©~ÖbŸ3#‰0´∏ÉVÊûa:©˛6Z¿{$Øz°*Ìõ>˙!íùª¯•ÌbaªD
˛»$¡»KÂBπºù#Qõ/mó¶ÌÏ÷à*¡lΩ˚Ê-Ãz=ÎpÊ®8ô…Âı≠¬›Œˆ6>≥∞€—wQ*á“Qû5Aæ∫e∞/…+^√†’≠.ﬁf¿Pï´ƒá4 ´„ìcñú√“ÏfNAXÅªøcòtUeAé	û§g8–p‰å›Ø%Fx‚ozép®<)%MàÚ9…`§jπR‡≤X_|¨´Ì≈<>ÚÓ3HΩÂ‡a^≥;2`ª£¶Kü ˜K´¬%:tëSAê77ÅkàâÎ’Y7Èµé˛˙Î–Ú+’’π≈ÂπÔ°KyÕEíœo¥ñT0∑pdñ´¯)»fq	{±àrÉ	ªc∑ë€ÇæÉzv€j‹\X{W¶˛«ú‹1Gæfßµ$—
"„OŒﬂ]%f‹ïû≥ÉèZ.àjr  ‡!„w•Í“S'ΩÓ‡ì˘òî11MA,≈•€Ä∂A√æ∞6¨˚¢ó¸≈é“3∫ö¡˙%|‚±¡{|∂){TF/E0òø@FäﬂXTïäß'ì ±Q:ra¯áeNùÙãÇôg≈–°´(=tdç∑ÕÂ GA˚<„ú¨|Ø–&hÑèôù(k2=ï¢M°ß»Ò¸$≠H%œXÿ∂-∑0¯ÅÚÁbÚf8ﬁ0§„—Ss‰,1Ê¯ßó≥ör¨¶h∆±ö&&ú§∆/r⁄ïöø"À„∏ÖY;Õ"£©f˚M,yâ†XËêd4ßGnË
o„SËxµﬁ	19 (H)˜€®ÉêóP
Ôï Ò™ÔëIG»k◊ÛA˝¢ê˜ºûﬁ%ÚÎÌ^Ç[·è2:hë?¶$v’˘jÌ{`»^¨^_CµÖ˘ÍµŸ’
¬≤üBOc∆¬“<˛∞∂ºäR∏I“˘Â•≈W£Bx(K∂l¶òü»{õ—‚˘ëπƒ∫,sC©}ëﬁl‰2 °À ç!røËz´ŸÌI™JÎ"ü·R8<îaπpIq…C Gà<y´c<Ô	 qÏØÙ¬≤ö&>∞h?Êî(≤–ørøåUñÅ%2\å Ô∫ÕÉÎñ…”÷NX–LCh≥≠Ô˜c∏MŸØ‡-@P3”≠ﬁÜRâàûÄï¢7
Ì∞EÉ+∏ò◊!∂π≈4¿B0äï§JJ)°Ó`E’A>@á ≈l6óc‘5^ΩâˆLÆÄHıf∏åÌ–Ù2D<Û©AÉ±ÄÑ∫…"~|ü˘.˛èhƒ‰çﬁò›+±äÿ;h˛M?5zËÏı6a¥|Aå†ËAm<s≈Y„MÊ
¨ÒàsÇyÚRiŒ{ÆT∞L* Ke@∏¥5I;‚<éÈJâòù˜∂gQàL¶±⁄”ŸFÆº¡Y‡πÑ<ı9JñÕ◊»*ÿ_±{€NØmA¬$≈˚ø$C{µ“tØc1ﬂÉ†|Ú|$Hìo∞0îRn<7ù/î© ƒQ¬Ô ã⁄Æuè	˙>nùdªÛÅTÎi„Ø°~tÅRî1¸PdnÉ$yR§ÚlπÏxÔªâí8aﬁn	áBò∞|…?bÆÁ2Ÿ‹∆HÁ•¢ÌK«óeË+ª¿«Í≈ıÄ∞©
‚≤D˝|÷ñ|XvpE;À4áEóãÊ@´%%pãÈ;÷!ö£ÿ_®∂Î‘ÔÌ[˜miŸó tˆ:¨Y¬;ÇWªHúkM	W\ÿî\]TËó~^Vö •M∆íÜÓ¡•è*[œ˛∂˘Q hÜ!êû8^7\âR¿
øib*vp"/ñ5	.O1>5&¡"ƒö´ßﬂÊ}Ë˙¿¥Û%&·-0S+ÖÔ_ü|å÷—‹Ír≠ÜÊóo-,ÕÆ-,/I¡§Oq5´dÿâ·`_Z%C•ØIÅã'œ>9˝ÂGË‰gÔ>AÉáøºˇz˛˘'ßè] …¡t[ Ñæ’±ù=7ÿõŒ2Q'≥#V,tg¿eH%”æ’B’:â)‰πÕt%ãÆ√—áZMÆëïæÈ¥lÙä”√;ª!/cÔ∫Éµ®¿h#Ü—«1 I9›ª”r”¡ôôø«’JØ|≥©%ä¸V)AŸ%€ÇÈÚÄ}Ò(æ:pRﬁ!+&â≠◊3ìu¥∂º6ªà™sã+µÍãd(¨∑y±ˆN"Æõ™ÈΩˇÇ\4x˜˛àÁ¡;?¢lÖ|œm@ÄGÓ†⁄æmwø!\E&‡ËµÃ§VûÉ÷\%g ´BüÊ ®àôé≥üCi‰ˇ`$¢À(áÿ0úÑ¬ƒF€î&›J*_î∆§®VW¥∆:Ê=9hk+„KÇ<Ú¢¢!ç⁄ìßO™©1/ÛSm$iÚº`{YÃˆ‚lüC105/öóMä‹ÜO∂‡ì=º0¯A?ÓEÇ€€E|ç≥–|> jü¬†ƒù%¿_Êì˘ä$s(ô»˜9:≠Cƒﬁ1DÖ_[æp^ú-ò∞ÇÑ=SäÕù<;Öò8C^√b¯h*ÛÅÉ’§√ﬁ¨ÔZM¡f† RÏñë¡_><˘√Éœøº˜ÂrÙõª9ª∞ÑÆc…paDi-˘∑’»¸H€–÷WI=Å1q¢]õ9#2 8R3…v]òå;Jº'a u)îñ&M&Õ2ÖKö<=º¯” &Ÿ⁄©0'Êìr¶![yBÕæ’É”¯Oh=\ÑŸ{É_œnh∞¡&pg•”C©` ÀyóåüS.Æ~∆∫¸Äƒ>
Aﬁï!Øù‰Ÿ⁄Î8,h∏O¶§¨¡iû>>ûà¶	s‡óEÇqâÈ‚-˚”ƒíõ<aÛÚ∏◊zp~‘~˚ÍâéãÕ•WB¿iÅV’p…zSnú“¶¥ÌJ∏¯˛—-ºù1Ø,4ﬂ≥ˆá7=)Ç0+‰g”y%{#˛æ|$Ôˇ∆©´j È √ï≤ﬁa”ËåY[§‹ˆ–'Mâ5ﬂ&òÒ! ∆´YÙ0¥X‡ãFLSAÑösö‹8U§·TiPTÎ Ñ¯6€Ñ˙6òÚç4ë—0(:˘Áø˝π/=ø:{gaÈ∫µ0?øXEs≥´Û2p-2RùNÅñÛ@H®1b;íAL;á¶+Æ∞∫ˆòá¯§dëˆ)¥Å’Òv‘Ñ’›∑‹!g„∏ì¿+yM3ê%9ü2â£TbA~Ø¡ó√ö∂Z;'öìÿ(îºäÓ^/eÜƒ†£‘≈£ªønòVÛ5ª¡
"ßB∑èè›’y˘U/ÿ¥;âﬁÒÕSÙ„√Sƒ3p∫~%¨`·”˘Æáw©˜]Fd—sÁÚÓï«Uõ¥m5»}'Í§$µÈŒaΩøæ[kA1 Í:ı›a˘D£ã!p3VÚ∂+˘¸rb»kH·8s,œ¿	¿ø`“‹t!Dá∑b≥èx7t(ı2>ëåNÜ*D;Ú2Ú°&\ë‚f¬ÒU˘3öpﬂ¨?]Ù∞¿ãŸ|≈√˙†FµŸNªﬁa4—Dp‰¨ÌL.•6«ΩÑ∆ΩFÊ≠æ•äGckH_>«?’Sﬁ‡¯F‡∂3—7e¸’Ïóµ@≤ïMê_umÄ_îNõYSëõt-beá`cœ7∑∑eçÒø´€QÜôDs"ºãÀç(a]µ{ÄVÏ^≥m√rØÇ≠ñ¶}¶Ë:A@,|+À}ÆXùobó5z±∆VK^É¿`Æ“Ñº3:b0ç‹«<$
#!K2CNd]8øY"6°ıC´CŸ¶≤äl”Bq<èŸIû@vJ™|”‡‚Ç"ºòqe„|h\\€  ~	´
Å“»8>‡ÅªüÇnﬁ¡wW∑∑±√¶Ü°iœ{(ìu†àk„“@z›ﬁôøK‘ÚìûÚµÄ÷û”Ωf∑€ä£€»|ÓŸçQ>‚Ö≈÷ê¸Ñ†Ü<÷*dÍ˝O$t¿0¢al§ÏÇl4lhº§–B…˙|“MFq<79=~ñ…†nI°#Aπ5ËW|MŸë^è©ûíI÷Ì6è	|åµ “KÊ\ÀÒŒ5µ1î^ˇqœÂ·_Yﬁø(E9ÚºqcZU°øC'Çˇ,Ôı#D·+¡.Ê˜1∞òŒπ8I~'ÁÉO§ƒ}ª¡Î„òT≈%e ~xl)&¡M›¥zo3®4^8\Î˙]ÀBˇ˝Ü‰C	Jq≈5UmC¶WT
+w˘zN4˛π(V`ƒƒQT£_ÂØ‰ÂyLù-ªÔÍ_Ác¨ı6ne/◊∫VÔ^À~°Ô„V˘rm∑i∑≥-ª◊?áW∆˜˝ªÙ°·qÉ…bÖ¿&¡OW”u:h“ÏI*Ù
IJKïtÀÇbnÕ^}©Øﬂ@Cs»b©rSYﬂÃ ÷µ(∂[{4∞∑]≠x¢>˛Ã≈O ßµºÅìq√O#Ë 73í}y≤ˇ‰ﬁÇ|„˝•ﬂÅó1ŸtÉz M¿sP˙{∆G† ﬂ-S9Öo L«dÑõ-Ö€-Lm5∂ßBÌÊ∂J«…7K£w˜ÚÑ8€⁄{ôQIXêx’Ò‹œå§ÛdÍΩ?ˆ)6GÆvm∏ù}äÁ∂}√⁄s›¶’πÜ≈%Ocﬁæﬂ$2~f§0Çz∂ª◊¬mÅ0çüµm∞qtóJ‡jŒ^Ø‘›m÷GWyØ%ßk˜ ›tfà9v⁄Ë\h∑øñŒ9 ﬁºÖÙ{‡B¢hB¥z<≈b%∫ÎÙ”8™/haËE≥˚◊≠qÑÿÄ˙xHCûŸœ?h‡GÓ^<J•,Ù2*å°KÑ5Üæã
ÖL°P8~˘ÆA#á¨ë[V7ÉYâ”√ÕM€\›ÔS}¯>’%}™ﬂ'¿‡&◊{Å^1P
Ù∫ºC„)Ó∂1E§Ÿã“èÄ
éÂ@¬„∞ﬁ1˜ `ªGñï¡ª·æ√¯˚0€>™õ¥˜¥Á·ëÈX°ly´‹(RX!ª^úöûV¬
Ö[a C≈¯
ÿI~ÇK•Å¯ •”YIõ_Ω<ûõ èÁs˘¯3!\1ºÚˇ2¿ú\¶k«÷:ßì
?¿Jç—◊J#†z$2€ﬂ89!Ñ
.)íΩdxﬁu¥ºıü±.û¡:EØiª)∞≠[˝õX ™É;F%’∫€ÓTÎ˜∆Q£Ÿs7•}≥”•=Õ§¸f4›Âû$≈ƒÒu÷0w£∞⁄‘ËSX¬ƒ?têc“Ñ==å9‰⁄Ä!»⁄0"0—P\¥CÊn}É≠˛/Çâ∆Ä>-¢˛NüÆA:ßÎ:BÕmÚN"ÏHX#Î˛îZaìô÷O&B60Hæ…kfı2 GõºÑb:i2œıR—d“^∏^*û”ÆùGˆ‘ehÅ≠'‡F≈<I…?!|÷^·sMP“gœ≈êæO¸yF∏Ï˘dƒÔì?◊ ‰o®EqzeZÈ›V¢Ë*„øË–·/º∂‰?f˙ï©Ä•"ˆ /Í®ê=4∫ƒÏÅ˙Phﬂyhtß'j°»‘K—3˙XºtIﬂ≤˘IÂ(b1·ﬁ¬÷®£JsQÏ≥±ä◊ˇΩîa¨ÑÖ1=Õü‡‘∞2*ºHäS≈¶b¨≈p≈+·zuL´êÅJ6å∫¶@•óÄ5®-1\ ©4°ƒ¨ÚcqL´eòùy„ºX&HÇÙ‚ñó∆,Ÿ≠zµec”~@î*®WI gπ™ó\ÜH)EV”∂ao[{≠æûTc©4÷3/`„·éÖΩÌ&1”Î¨BÀ`ù™Jz0◊f{«Ñ-ÙÍ3ƒ8Î‚!‹Ü∫â[~!¶Ùé”j–Çà&¸œ%Œü∑Î˜r—‡ÓêìT∫3ËÕËπŒ	˝ãI;í]q5s¨P`NÖJs:§·yÄyØ òz±›0†ÈàM÷RÎ…	ÆX∫0h'ˆ{W˛¬ÏèÌzﬁ &~5Cä-‡È; ‡≥0ë€X"B•aZã;¯Ω¸™~=}I∑Á‘mºhM›ÎNoòË"íŒúVÁpÏjFºM›®Åà fÏ_^dwﬁ/≤≥æNÁñ≥Á⁄’âK‰[	æáˆÃõZ¥≠˚ˆÃ◊˘9œ®Ü@÷ßÎ˛€JºPT_DÜq%@$`2èx"◊˝–ÊäüˇXh–4◊±¥æﬂlµ“u<ß;v≈øuúipq>4eBÁ]·J◊¿≥∫‘µáÁÑoHç◊’p∞≥;XÃr∆B‰Z}ô±·o¶tú>Ã∂≥o"W∏ƒê,.Hr÷&Û«µß«ìÛ.Oa‹q∂9	\eî1\˝é°/5íLTêL√î	√@∑*Ü¬.Û≤¿∞"a¬9†sÍç|7µnü+ƒqﬂœµ¨f€h®“¡z´$π˛÷T^=èëJËßÅOpvCz,‘!√ù‹éPÒÓtZÕÜ¯ï?8ˆ-7ƒ|b⁄åcÍ,·ëúê÷zV◊]«À∏!	3Ú£¸¶ËÜ„é∏Ù÷|,“ø5à¸¢±û‚˚ºj´…_væ¸åèΩÚ	”n€=´’h”˚kN◊(˚°¢yBûπR¡ »O3<´πj[Æ°´2±l?¬æÜ`5ÖÓS"◊$‚ë¿ÒÅjÁ3Õ=ªÓ¥€6H
OoÇ´ô:7öp˚ÍßÙì†[G≤„
<Éë$‹LIL¨Û,wﬂE`5ûúÇrñ˜-X6|CkVü˙¸Ä)ßÉñÎıΩn≥§ZKVá.“Úã€$±¶Í¯∫¨òÔU’◊?∂Â˘sº…q[é%?©*K" ‡xQFŒ|ÙƒƒÕ∏*t˝@íIaÙ%´'M<}k‰È…[ìå‡Âππ€+’yMÜ©?˙»XÔÆÿ≥†:Fêıõ—s9_AØD®9Äœﬂﬂµ;¨≤
U_=JåßÎ»˝œë∞çPﬁD∂ú)ÊILØˆ”PV§§
◊ 5Ôª7ySsl¿ÈdÇ˝§%{›*xYŒ“h˜qC≠≠fü Ü$ZõÌP∑}Ü∫~ÚÏŸ‡´«dÉÆØ,ŒŒU7æÊ˝©ÌtP6x≤ÇnêS
™u≠˝´'Ö?ír€ƒBbæÕœBﬂ‚mïºË|ﬁ®(ÜèÜKM©ryŒ∞ï¶Ù[…Éjv/«JÍƒÀ`d˛F2áÂ‚Øıø˝ÊwÔ¢KXx◊ñjr®Ea§_˚∂(ïX–:=’ûœÆ0>=ã7G({B∂?¸c∞Ä™ﬁ%¸≈m˛têlk¯ô∂gﬁˇ¸[®l5Ÿøë;cÔåUwd•…!‰|vG7J⁄Ñ&˝ÕÒ-›|Çîlx∂éBÃ|}q{Ä®f∞1ù}º˝∫T@´≥7™ﬂƒP∆”äCRûj˚ '{”zçÄ]±	<⁄ÔíˆHsÇhö˙	8´Ô‰Tú≥Y)…°(¸àÎ2Avm3ﬂ√∞d:∏È∞Øñ◊¯'ï‘ÎG#˙g1e>˙ˇ—‡È;ßÔæç.Â‚i”î:©ß·Ç±˚fËùÌÚì÷,è?2ò9#¿µ»<˛ıÒ˚ﬂ_˛ù¸ÏGœø|Ü“Á>ìp¯?∑G`@RVë©k~DF˘g{mX2j-Oæıú©2ºí◊“á¸p≠û$¶«ó±Êd$19<ÔcR¢ı∂Iâ.íÆ]∆îX(Aï.¢bïËG>Ωª(±‡Ê•pú∫ö£1˝€n2lQZAO@–;ßn€Pˇ<ë®Ï/÷œ⁄ª˝fß1
∏Ç ;¨&7ªº©á°o[-“›` <'U"π>•Ò\~˙F—≤‚Fa[Ω˛n0ò3^àiajp≠`SŸÒ©¬¯yåawÈÇ∫˜Ωij·âÛ∑¥ts<çÈ¯<(6Ø’:»<}”¨‚ùìﬁﬁ´Ô∫MÀslFÄt¥¿aÅúµüvk;Ë‰Nœ∂;‹ÜÛH≥,L$ΩKKÆ`jôûd®DgÏacﬂÍq}|≠Ÿ©ßÀ%ooq0â‰˝Ê
„‰ü|˛zÿÜ–'û´≤˝L§á∫L"ªEœπäò≥ÊJüG'{Œñ”Á6ô∑Ä1—i7åWÒW3èŸ,Ó!ﬁ7ÖÛÿ”|>u∏MM‘§IaßDﬁœïTVLaOﬂÙ¯dÇ‰ÁápéŒ
Ù≥0A‚üé&0Iâ-ü(;IS<—–±6á'†∆¯«¿ßôﬁ„	Ä◊ ËœU»FO‚DÖ»≥x8è∏˜R!åê"{-–K¬∑¶Œ(˘«Ë|‡{5˝Ú∏ÍπıÕTû”ﬁ›òE(ª≠Ó!ÂÁµbLT√ªoªPÁL˘^—ÁıVO ¸ó{ƒZ˘ﬁ†r–πºö»TxÔ¢mmk^KÈyΩï…IxÔM´›÷N4·ˆÁıb_¸¡´oÏ:n_Ûf&˜ŒÎ›L™¡õØ9∫˜R^}nsÕ$º7(È+eB ¢íºV∏»uäìÿΩÏ‰kNgœEké”Í7ªÃJÊt–Mí1wL&/ç´+2©©+0AP§—-YHú¶!xﬁ∑99.ß« xE«aÿ˚PâCU>AQíO °'§ ∏h|Ò£GZë⁄ë√:´#5Ô^î\¶Ô‹O˙úÂ⁄©±c4¯ÒO>ˇ≈ ùU^7U€fçÈôo2∞ˇ,BX∏áïlµÍ{-Zq•gﬂo⁄A©ãEÕ Í0rY´Ñ0ÌÿèCn∫8ﬂö4¥≈8&„©òùTVTÒíÓØË{…t3=Ñªı\Vi…Ñ]M≤QÇ`(tÒ{„Øø˛ BÂHp[=>Ô»(t[Zœ·Ó…ˇ¯Ú‰_>=˘√œø|VAÂ/9Ü™~Éˇ˘¡‡Û«Ó¬ñXY≠æ≤PΩS!®–%’cw«L∫VQîö
LêXÙ¸ŸÎ'?˘àD¨êÄmm	é¢Œ'ZLıX€%ïœ–ﬁPŒnsãpbnSÕ£…)É-u.ÅbÁ‡à\œ≥Œ≠`{‚±<0L>ó$ôÛ“s-rE1•Ÿj—¸
yÅ>∫©öùé¶7ﬂ¥ØñÔ˚T}JúÔìÎ∑∑`CÁ◊îîóÎÉÎzº˛˝Eå#˚ì?Ωâ)?I˘µπC€´æ≠ΩÜÌíD¨s#ªºÇmCdC"*P“”≈(˚iÇÎüP:ªê5£C,azIÖ„zÈ%EûÇ2ùÄL/n∫¸|≥◊†¶õfaÜ–7Y≠Ô∞^…ˇ 
	á/UÛrmøÿ≥º‰¶T˘hÑ—⁄&ÚÅ‚zVŒL—p!
™†OZ®ÈÙ˝«h¯Õ¡ﬂ <Ö»ÔµŸ’’5É PsGß–´wÔy(ª≥L.ÉH^®cIlÓ‰åd®ƒÊ¥ƒ2æõ{»n‚%´ËFˆπæ¶õxôpÍa"‚ˆ¨=—µ%Î ,ä∏%ê›fÅJ%£@%sJ6 “’ aË<®ïS øŸŸOﬂíÌ2˝ˇ÷vÒ·Á’˚EP¯7ÿ0ò´Gÿ5>_ˆmvq'Æpg‰µ)é˚áÑA|~#)ù∑>©oÎ^;B  ‰.ªw∂	†w7…zÄª‡U@‘µ~øçºÙ™–(©É^Q¥GÓÉµ1}C%ñº~!Ic®Èàm›jÆdgËq∑OwN˙"¡ˆ0∞Y¬•´!ùî˚¬•Æ.çïÓd|.mq⁄íi+2éÆµ9írIC∞p∏Ãî˘a"ÈË5µ{Bm8\ÂDÄ)ﬂÃyKgªQëT°mˆ≠V≥é$÷R[—ü7Ô]
µW˜®$ﬂ{ÅuúüÄT3„wßgn‚n4zΩIÃΩ<¥ÏpnI.Ø/ìÅ˚{yÆªßørO)Íò˘›Hè˙)èR‘ Æ∞Øi√S«Èπ¿ÚöM¥ü.¢]R®O¬FÇï¿Ï∏ïÄlåGO-f$_-*∏q∞íùõc·:KôÖ«îUè5æoµˆ®w…™60}Ô⁄Ñc$=-òXKÜV≈ò–b¬3∏¿%ﬂ*(…£43ø\≥≠^}W£ôsÖõx›º›0“øì*ﬁâ‘g‘Üö”#]ßªh:{˝ÿÒg$”f®.sÒàBÆ5ÃÙNã1⁄∏Å^3nˆ@†‹û‘Äõ§À93Ü…È^F˜T∞0q˚Xø≠€¬AË*©Dó.è£≤ˇºA3j¯5íVTA˘sõ8°⁄]í©„K„e39¨=&úÀa8?Z–@WB>Ûœ«rsºfIaÇNCjinC®`öñÀ1–å§9yB–ÅôVéÔû!˚¸ÿÏÅ¶ªË‘ÔŸ¯!8~?¥‹!ÒÏ)√áÊ-¿aƒ]√ß*€Í§Ùë†ËRÜJ◊ê:æÄwJ|2‚å!”B—µ'bFΩ•7’ø‡ '„ÍÍ[Xj8€®fìíµ¬Ôô]+p&éê◊ÌÄ‡Éµ6~#	ß’ΩRºA|'˘ç{©·È¿lEIu=Ç”9√JÌ¬á/ÃZ¡>gé§°Üù	U°5ª˘o±ö5Üß´÷µÎ∑@8‚>vwöÂ¶Õ»b´L∑	û9⁄∂∞⁄eÚåë≤⁄ÏıñcÀ<≠"H /˘¬Ä4`™`›AØ§&H÷ìm÷Ë≈ıÔÁﬁ˘oMhÇã*Ux·Õêæ(ÎÇ±ÆE/ç›(œôh&MM4pilGyŒvD$Øy´24Y(cﬂÇK]o7õ∏ﬁ.y0éÊPWà	®#ëÍà6ﬂlNÂ=p√∆ .¯Õ,BOïÓ˚Œ∞Píë±ª≈±lK–bÜ.Ω+úåXÃM
Ë>!)q:æ ôx1„ƒGÛ÷/Å:ˆÌ|Â˚D/7∂ôZœX†ƒ)£Åq∆:˘≠%≤ü¿e4§Ûà¸IBqÏ1?≈[cãóõIå#u	Úñ5h÷ıÂÇÙá L4g.;Ùa∏`<NS∆Åˇ¬|bí∆“¿é }˚•Eé,√Éö˜”e¨…ñE.k•a4ﬁ⁄*ﬂü∫ét3gFÒ∆>#r#ûœ≠fK!ç–êrà=ƒbOõ/ybe·Ï÷aüò•¶rVAr™2'èÉü√LﬂﬂÑ+Àw™´õ◊ñókk£Lf@ì…òˆÔTgøW]Úöf©UÂsizµ∫∞t}yuÆÍµN3®JÁ“xÌÊBuq~î7∫ü”ÑÃ..∂I’íÕr6˛41ÅV™x
åÕ˚Ü7ˆõòUœH£ÓÑq5l∑ﬁkvaümﬁs∞W˛jwÃﬁmÏ§äôﬂÀ◊âió˘¢$Q—Ã«n+”…WÌ!≤‰•ë ïszsƒßk÷îø'”+åŸ|Ä—r-âz`ÑWË8Ωvú/·ø≠ûú{?)2ÎN¢T®∫@[R4y:At\ÁÎàÃyäãÅ†NÃ¥ÕÌV»_]∆c°%ÈúÑ›ÒÌ˘h0åû≠5ö√-û}Œ÷"Õº¶- )√∑†ö@‡9√4æ9Ñ$≈”gj“√ÒÖo˘LÕ‡∏Aíï|∂	‰°8pã«m»~6¿Ÿ®Ü√πN¿…GÌkåDåıÛSÌëdkáÒrπ3ã•»´‰/‚Mî#Ñ0^ƒã(£ê¿/ºàó…^ƒõT /‚]2TÖÒé¬ãxó:·EºLäïBfPäép.o26Qƒ¡±E¶Z.√&ùÆ†ZÀ∂Ô!@BsNØÉIÑi†hv{|áh≈ ®õ5≠@'Tk∏dñáƒ4§ó‘L‰D¡Ã2[FiC@©ÙQk#∏ñ°Û 	,ú(;ï)ÖReπ“Ù•ëï›ÿDfÄ)4J†q/ÂM
	ƒ5ÃQ9}N≠z}Ùªˇ˝ÂœŒß]_@ëv?;s£ÑyUﬁLí˙oƒ ;¸æﬂ]«˝6tÎùß±3…¡⁄¨‚Ÿ†‘èi∑ª˝C?Ãùﬂµ¥J)\LÍjê˚ç3¿DnÉò*y≤™6µ≤=˘íoÅsœWkﬂ[[^A´7nÆ°⁄¬|ı⁄ÏjΩR]][òõ]DµπÂ’ÍµÂŸ’yîjÌT»1yyiÒ’®k¸Ë¬ûzp°çˇ_ó¿“ÏÏH±¬óUAˆﬁfÑ=‡Óˆöù{‡∫IÄ$≈–ø¡’Xê0Gòê|Ü≥LNI±Ë¸^R7f8Sz˝•|6◊»56|nN:BÌ„¢§Xß.ºRi‹˚BÃ∆6¯ZûR∆NÃMª}àjußß25È{Ò»ÇTÎ“J≈\’6qgZ[O!íV¡‚R|‹(ê§Î˚Ω&¯”≤Z¡Ñ◊o÷≠V∫’€›”n‰ zu©zÎ’ù∑1Z¡hÌ‚ƒ±í“€≈\>óﬂê|íB.ö·∫mi≠/?C)√U.ƒ´‘QHh¿ÕXMÃTI¬˘>nÇ§Q≈Ñ°4Ôìà 3Íczì«ÆÛJíâ¨MØÕzH∆ã‚VƒNsPtô%sΩò]√·È˜ªQøsŒH¢Ïg$“ C¯‹»¥ÎÂ”q§JøKHÆgÊ.‹‡ÒóWóok∏ã¢ø“Ø%_Ü!åx…ùˇ˛‚•
Zõù£{q˘J›ÅÃ—Z¨êhπ”:|Ò“:–™Da^/ò≠Ωæåp»Ël˜>q!»Å›≤zh—Ÿ1∆‡™E∏/¯øE$ÎÊÖ<D#H)6‹\åj†©#¯uä9®˘ﬁÇË)E¢úÇ|◊Ï^ªŸ±ZúsKÿHCkºïﬂƒ+üò ÂúçrÆıó≤€π…ºµË."‡>Äz,Bæ$ïâ\6(QŒhD\OP_ÏC—;øÂCBCàzY¶á¶±∏i∑ﬁsZ-†ˇ/Ëä.r$í„á7“(TùÇƒ*±ﬂ¿=≈‰Íf⁄V7ïj9;ƒïß?ÿòágêìn¬4cnUÑfí$å¯pDEÊÅ2Q““zﬁºdXÀ& lQãﬂÇj‘-¶UGÛ_[FiÜ0∑Å;õ!dÒû6ñﬁÛΩï≤B#»@L¯*˜–≈L"x"æ,»ÛﬂÁU‘+πH?Õ¥ÄOøõÚÃS>|w<v∑ˆÜÿ‹12sŒ63"åi∫czV◊”√‹®›é”Bñ˙®÷±∂Ï˛>»gO˜-xìS"´ kt¨ã∞˛W2≈L>.¶Ú2I[¨4Ä"íÀúp¶ŒÆÏ»ÊÒE,`–
tÚÉ/–…O?õ8}Ù1<~c´ﬂ£îá2˘„º˜≈‡Wo°ìﬂæ?¯”34¯ˇæ8}Ù…ÈOæDÉûûæ√´Hdù˝N4¯úBt—ÙÆ’i`·EºTv/ÿ
v7≤K≈;Â∏Ì
‰ÊCæΩó£ÔÅ≠˘ç…ê∞ã]øm®z∆"8ÈM>@¨∫zÖtR/ÂÏ¸ta¿«Idx◊Í·Ô·ÛÿZﬂÚK	•ÅB*§j ¸À;Pí?H{Ç']o5ªÈÆ’ àôºnTËÒTAéK·QÕÙ™_AùiÂåÒÅ.ISºπ¥oV4R§ºÖ·=∫˛\ôM®•FπÙ"^QTk5€Ë>Ö≠Y;(ı
[ßÉŸÇBKﬂÒ¥”1 ØÅ:”Â
∫âIcbﬁ∆íi‹ò∏Õh¿OL¡4‚Y»≥∫i˘∏˙‰ˇà´†_:Åò¨®˜ÇGÕÕ
¢|V‡Oòﬁ¬¿û sïÚ/®„©òÃ≠5®“¥¡B~üZâ°9∏E[ÈÌuÍpFj[È}ãf¡>Á»±Çá¢∏rdoo€$øºÕW±¸rÅ–°=Rî@¸µ√æ≈]íÉÄ GÊ^å\˘_ˇ™|Ï ⁄
:J’N¥›Xs˙Vk≈Ÿ«èﬂôÀf≥côæ≥Ë@&L≠ı`Sc“Nπóx`%∑Ò∂°∂¯K¿*ñ%≤`∏Å®ıj#W†∫/Ù—l4 J‘Ú~ﬁ⁄Î˜ùNË!P€fFËOa%…ÈÃµöı{3G4àœµ˚nk0ˆ-ßaµñªv'®eÖ◊,Z‡T< €R¨0ŒÌR≈ßHÚ¡w%1?$¢Q®tg¶K——
…íJ÷ßàLœ¿|ŸŒíÅ‹Ãh"iGü?{™˛¸…È„Ë‰_`a˛¸Àg≈≤fwàÃ`»ÛYJ≤æ˚Õ?™Xjöå¢y?y{ït+M–58l§.¡dÇÅIê“C]"?*ê\¥j∑±2RS-7åôxîU‘Êì2p€ôuPd™úÂ9˙yqmø\3œ≥C´*]œªÉøz‡≈#™Z¿¸spÁÊæ´HÔyJá‚≈ÊO—…á˘˛€É_}äqÀÍÔf∞(J·#~	•QjˇãòS3€Õû˚T∏Q›áõÛrá“¯“≈jCßœM>Ky”‘Zy!oàùÊ–Ò º”Ù—√^Ú<ïœe¨å∂®BÆ⁄>X3˜¨Ñº‚Œˆ@KgÕpf(Oo-M∞áäXª€´ÔbÂ∏ì>@"ºr€≥_qŒ…ı∂ÂﬁK7!º“¬“’Íj{ﬂŸ$⁄!Ø≥èjŸÃï±*Oˇı«^N√óc¸ÕcÇ$B¯XÑó@ÌˆîL∑oı˙0˛7(ﬂ°Ø¸fAÎÊô°>;öﬂ|ƒ`q<„åPÔAÛÒòë3&†àúAØ≠√KDQËDEå2c∏È–GEPºŒÍGÏ|ˆM‰◊êäÁ“ñ=#_¸¡∏ﬂ7âQƒÈ¨P~<ÔÏwƒF`!†!ÓZ•iÂvwÊH˙ÙÌÆÊ©E€∫oÛ‡¿?¥<);M¡•fM=:è]œ◊UH^W·Â∞Æ∑Á2Ÿ)ààâù|_¿ﬂÁ∆"ÌH˙Ø≈Mú¢	 ht2xYÀ™‰˜¨"-+§x±Äe*&3:]0|ËùÒÑÂIæ/ôÃÈœö’Â!˜3”“Æ«Z≥G‡¯Wæøø·ùKS‚Ÿ∞<≈ÄŸÁ)rTlÌ¯ü…Ôñ€1∞^öò‹+’ƒ‰{”|1Ç%ìPmpåpFÔı˝f´ïÆpã
Y¨mß◊gÑ∞!µÑs”	‡)Ø•e‡'êxDöU_∆9=tê§*Ñ:B˘à2∫¨É5î’Ú·Â'0g3ÍO‘xπ3`PàK‘¡}∏L ÎWúùüûœ êhjl¡™ÜJ]"ú ¡´’πÂ[∑™KÛ’y©1XgªóH3⁄â	\OÁYlào,˙·∫õŒmå\QX™eΩ¬'∫ ˘¿Ü˙ıêø]@I‘G√™ ]£Lﬁß#Á£NƒaÓ+î\ó¬&ÕÂÈKô‘¯/ôù®ëFá É˜≈°{Å“tÅõ≈˝ﬁ*Ã=Ÿ2Œ`‡√¡sâ =è”%ÁoaB6p…€¿”ÂÒ\B≥§]“⁄òtjí"T	∏O∞˚+¯Ñ°ˆX„í=“!5;`≈†WçÔNÊ >p¢9ß◊∑:ÄŒ_#˘¢"ÉOkx◊	¥iÍÙ›∑O>˘˛¯‰Ùù«'?—‡'ûæÒÈ…‚Ø‡§}˙Ó;É˜æ‰›Ex¶fÒ)éU‚<¬&;ºIu⁄ë¥’ÙW]⁄É1îÖ;Ωñ∏”kªèES∑`ïˆ#n‹â©,ÉøúAª[È\^ÁUÚΩ3¬Ò[b˚T[>£vœ⁄Æ≥œf˝Ê^#’ÌŸ˜·óGàçpov‡‹õVƒÕHAÆ¡.2}˘ñ—¿∑≠Ù3Ù•ˇ¬ëoƒî&ZN	¡BV“∞UTƒ©‘Jy˚ÙáØü¸‡1Ú‡ÈÉ¡õO—Õ€Ûh+0òNû˛‹≥õÆ9;;P2†{|ü¿ÎB∆)∞∫MI“»ÖÀ2kÎë+,Ñ9(jéÆ£ø˛Ús§&⁄ #§∑Œ-/.ŒÆ‘™¯è’µŸ•Y6R|OÙå§™F-˝Y˙“ì?=<xoÏ/(•‚Ag˛Ã˜¡ ÉŒ§js´∏üh~˘Œ<v3Hl_û©Ÿ‹ò"Œ∏‘£Q∫
˜ÆJO¸ôW∏ΩgFÅcçöûLµoR8Û˙CõœI˚òqÑÇ“¬≤TçHäO’I¯ßøõñÒÜ'∏=∞∏&°âÉ‚ã/ Ωû_+ †fﬂºbP5{¨÷Á≤˘Ò|1áÉ<VÌ£Qzë i,>ôêø{X≠&[î∆ôHæ"j±”rvzV›Ë5>Ü¢Yu⁄[¶õB CÿJQ÷¶∆h≠<ûªT æ<NæƒJ¸œ|76~r:€∞w∆£Ûó-é	∞O<ñæeå∆S–®àlˆÂÕb˜`º—¯√U¸ºàûb:\J£ò÷E|ˆ¨‹síW™ËÊÚ‚Úç’Ÿ[hˆïŸµŸ’$—ÍIZœè∞˛>ñ˚$£N<@¨LàQú››Ìe∂	£äç·.˙Ñ∫üŒdG.)JòºP‘{ÖûÕìCaL!Ï-œ*‘3 ∑]ı ø‚uW·ì:±ïcºÍ»@éõ“Ç	T(k„-U\qjo˛ÆmaZË–Ã[ìín	-$•AÕæP¿!4—Eëè—
…DÛ…ÂîQÖJ ◊aÁ.=‰‰tÈãôΩú§¸E+2{Ö¨ê-¬√£5,wJ±”πÃñœ%;	Ÿhˆæ’∑zh≥¶Û•\Â=æŸv=G
îÊ°B©."wÀ9®ë≠ä…bµ Ùs›¨≈±ëqDn»ó§7L˙7®[ÿPw| gJÇˇ,t‚paÛ›]ﬁ¨‡˙yÇ-›w“˝⁄Ó·„$ røiÒ°O¯&èMf2ÄT˙ÉäÍ41ß¡ŸBVñôK5ÖÖ|H0cF©3ÔßY«˚¬é00~∏∫Ω°¥∆˘êTdíΩ¨0:Ÿœöi™£Í‚{Ÿ0H ∑€<ùyΩ8N¯Vj˛jîe)Y6:ìâPê+Dwúh-fE˙”ñ+âÌpw
Iú©√máÁ⁄aò·‚Yg8^3¨ÀÅ”¸§Ÿówãí‰ßú,˘âg)Ç%d‰
SY3≥ó'vã wu9zboÅ	πF|ìÀHêU{µ∂IUÂÀ›Ñs„Ú.ÇÙã˘^ÀfZ˘ùÖ%¥≤∫|mˆ⁄¬‚¬⁄´	‘p2ivH∏(çb·‡ﬁÛ‘–5q“°p?éãíl;µO´Ω∂;%´ãÑH)#ñµâ\⁄á0õ
R}m‘aGˇÕ›Ω∆Ê~≥≥â?Ÿ£eÿÙâ—Åãÿ0\$∂Ë‚…e~B?¯~‰ ÓÁJœŸbàù«/kS·ı¸Cb[·≠Ø¢ä≤Î4%§öèf	v”Îƒu«˙ﬁÏtîáHC’î3ka
ÏÔV–h)˚≤‘(Â]˜gè‹Ωô¡ªÜ∫€ÆTWUµíNUõCmLıx∞n‹zò>aOowl◊≈«C,§Vªã¿«MUÓ©ÜB$ú}J¬ŸΩ‘>–10±jwÌv∏Ω˙Ï-≥ﬁé|7∞‹>ˆ:˛·…æ@'œ~Üˇy6¯Í1:˘È≥¡{_ú>xvÚ—ü—‡·áÉáOû?{Äû˛˙‡È;h·œ3$¶-pyµÎhÄ#D ’	∆ÑÔBe«Õå®r”•í«Hº¨RMcÌÊjuvÕW◊™skÀIÃ<Å|¡l‚)_4“√GøPÀuˆJúTâC#é‘‰˚§
ë–ﬂÌaÌ/^ h6—mÉvZS]œÃ‘óßŸ=>ÇK>l#ø0ÜÃEƒJY=Ö(bõä™"i(˚≠;¶3”Ö¨]™®6œTªÌÙ›H∞∏†}ñwÑe8Ó¸u∆˜Y¥í‚á∆ì\,¬ïº72%<ËÇ¶π,{5
¥è/ »)gIü&\ﬁŸ˙œvΩ?jRÌÏ*∫ÀJ+@»∫LX§dÔ	É∑ˇ√?HªC“µ	NYl#vGﬂ»Ò]É—TÑ—»;æıqÜ€≠aë÷ 1∂FZ@s∞ËZª∏=ÛsãåÈã!i<ª*©Ù[3(‡]∏∏<˜ΩÍ|å¬≠Öã.ûÁÜ±€â}ef‹H˙=«|Âöî:–úN§⁄—‡…É”«?Gê·Ù€◊—…£◊¡Å:OÜj=w,ÇsC"⁄(çπì˙£û6©û¢’|ò ≥∏|£ÜU´Ö•µÍ*sv·ˆ≠ï5¥≤ºr{•ñDZœe
æT4–É<;ÁŸu£p|VÔ◊rFñ@Õ$à˘2¨µúùp ÊÿH‡dπR[õ]ö´V–ë’∞∫∞åµ>ú»w0ßun√"Ã·EPÊz=1>ÚÚé|I‹¶Uût!€‰nzΩHÉÅ≠¯P&ƒ©¬≥!ô˝fÿ5GﬁÙË?õ'´≠Ã,<„∂öurª
c>tMêà£q	 9Y3\ä6äkÎÚ¸#`á†˘Ú€Ç&!ù F3⁄fÑÉÖdîª6CºJ√;π2bT¶,“Íf•˜ ˆ7Ç'”†ë8êPï¨◊Cß ŸóD≤‡…∑0å\Yrh∏h`- m«Ù«˘˘Üã«§nóø€√ú¢0WzNªãufCÈ}1-ªÈo÷≤⁄»¢dêRT&I1Â$¡S~âomﬁΩ¥	>fΩ–˙˙Ö†•0V)ÁÏü
)Wë¬°ßaq˜Z:à ‡PCÑ®µ’+˘!'ä≤∂∞ä⁄Ë0‚ïº=$bßáñ∞pÖ9Û˜lÀúAëWh≥æQ•o0»p∑r b¯g¯√8r§Èål!za≠∆#PKS%i∆Ä¬Gc˚†´óiácÀjA‡{CñBæ§zADR®a:&ô›ﬁg
Díû‹=rı[;≤†e>"ôfÿ3ßNE-˘+⁄ãêE?”≤∂Ïÿ
÷2PÖË•C˜28∞∆G(≈òÅúIÜy•ÃÅ&Î! Uƒ#yFÇ:6ÿ<î:Lª{Ì∂’;$Z÷°HRY9RQæâﬂDM	pb((¨ bK@Nª√G<=fLÈ)~£
Ö∑´ïn°|b»"7qB^z‡»!,FóÈP‡ÄARE⁄Ã;Fîy—*√Ô ñU®0üûzë"Òˇ«µÓÙhª◊|P1Ø&à,∞F_ÉUﬂ@~ﬁU^·VÛ≤˛àSçï˜*QßClîH€òÆ¯(£y®œeÂàƒM,zö\=ìƒ3r≈œÂœ»¸#‘ˇ7¬;¸§ÛRæ∂õ7JÑ#DBíîXí+¿mÍU§30éA_ Úz˚ƒ,&HzgAäûR“ÄnÚO[Õ‡Iœb®|êﬁÊì'ﬁ)8Ú˜S£˜õu¨sÚÊ¸˙hÒ≠{;‰H¬w¬˜=k?Œºryb7/H:9(s›rV.8≤ÛpïﬁöÆg3ªΩ¡G‰Ã9Ì-´øY≥]å·û,ıçFæ ∆1x˙‡ÙÕO—È£èOû=C•¡o¢¡˚où¸Ï]tÚøüæˇﬁyì‡=~ˆC0jJSo√säeù—*>4∏%LsÆÊÚ‘y†ñÖﬁ%ïjÈË]RöGÚ¸x≥˘î“[Väö…o>»ﬂÅkÑwH
â]‹€Íí—),p:ªI‘Ê≠‘ØöFv	"h{M˜ö„∫¸Á˘ΩŒéÌt¯Ø÷úΩ¿Ûu˙Ù[≠¢zÇE$ÑvD|˙_0B<˘Û…O¿í>}ÄhÍ)˚Ó‰gèÔ<x˛ÏÁ'ﬂ<y¯a&ì—;ã*âﬁàˇ9˘Í{7˛˙ÙùOÇ˜®ΩIïØkÚ ôπC¬“õ$ök2+§)äæç·-gkÎ0¶UÂA@çÆû‰@ŒÚﬁyÁ‰gOﬂ@Éü|uÚ/üí¯ï¡Øû·Oõ;˘—óÉ?=Ò¿mcô% ©Åpÿﬂµ[òÔT	¯$¨¸RÎÉ≠í~7f
= √◊◊Ì¬≠Ñ$yÖe·H—YçÂŒA]∆®K&åÆ!ô5\z≠åã ¬¸ó◊“¥˝·´®êÔCƒU¢˚*QÄô‡5˚P¢3Êˇ”ìx(˜nÌx˘MOH·j=Kía©ïÊ¸Æ˘ùWÔ¨⁄po
	û+é“6%ÍŸ1J] g_Fµ•⁄X,∂ˆyw4ﬁr°`WG·}˝ˇ‹ˆ·Û4!é	˜è¥ÍÕsŸLbh¨⁄Íú|ˇp’FÂπÖ;V∑≈¢‡	#(R{=@4‹N.°9o#mn9ù=óﬂNôûM¬)S£GÙ÷c¸+Èeo∫”ÏP ùßà…c…ˆ‡Ïê[“mHÓ7ﬂ»∂ÜÅu±`U%nK‹◊\¶,TÂ¡Ø.Á"í$Qn† ®pÌ`o@–√!°=´-F¡l“W=„˛–≥»[©g3¸rï˛ÒäV%±Kçèﬁ‘/Õy^&âÕñÆ_ÿb˘∏gY*≥2xCÆêò<–™ÌÓµ˙®F-Áh≈Íÿ-î¬Ïãb∏xøv˙8"@Ï ∂‡€∞≠V¢g◊m¨"„)btÀæo∑l¿‘èVÚ¬]°o§/$Ôâ°G~õQ•†êÏ®‘5äOa.7!&ßË§π∑jı:ÄΩ’≥˜qgÈ'	zårûr∆8s˛ÜE´Dæ∆ÁŒ»CﬂES%t	•‰*§Õ\>+Ûq/XeÛ,t∆˚2⁄ˇ±Kò∏d›°3®Ì
[◊€]≤Ã3G‚g	ÿJ´`Ã‰◊ïû≥Éó?%˚6˙,f©ˆ:QLÙ∂`;Õp[K“u∂€ê"	Ó™[Î⁄vc∂HÁ◊@ T1Ó;,ÊeO›∆|≠◊pvÿ#{˛G|J?úkYÕ∂å¬öÓg´’Ï∞ßv»á9ZøIz˚-´c’à…i˚_h^Rıj-Éâ”aOÓZÓZØπ≥c˜¸Ç‰ÏY=ßÉπ`√üÔÈ|x–Ÿ‘èôgô}îåHÖπ ´hèwÏ1¯|Ò_`K°èNﬁ˚3Ç>Ñ?¯Ù‰ÈWœøxùl˘’Ê}ÇwÉ¨ÄHòıÑb	Ñ{gëo’O-πá"{Äî§(©üºe¡“ˆk'À˚Hz=ªq5C≥»ƒ»!¥æ˙‚‰·«ò◊V«»Pøg5¨˚,E:ÆÌZ={ÕÅ…ÿÉÑﬁ»Â¿Ù&ª›ßöº∆¥ ÊÌæ’ƒ[ùâáPs+é€gM“ﬂIÂyãR!tÀÍ◊w—l«j∫M◊G∏ã
^~^‡‰ßÙ¨®Ö4*áÕÕ—®Êºg‰∂©àßûÔ¨îfNû£Í'6E˙“›R‘^TDõÚ`≠°z°°®^.ñéË+d6Ω5–XC/éÒ≤q?êj5–¯ú5$ôS-RµVò'ÜaJ‹l°∫——H}N…ÛÇ9Ö¨°pù	ÉuJó\*%≈î˜.äﬂ•uÄg¢ZΩ™B;}Œí<g5ıœ4ö€€¯	RX¡⁄rSÏ›i÷ò≤&|s[T5àr6Ê¡Ãè‘÷f´∑f◊™#∫»ÀØÃ†R‡ı≈Ÿ;ã’ZmÛï»;|’Ë˘B¸≠Ÿˇ∞º∫9∑º¥∂∫º®|ÿª{©z{uvqs˘ïÍÍÍ¬º™≥«c)≈iZQHÆƒ«Úùwﬂê…ÜòŒeZ›Û≥ñ≥º[ï‘k⁄ºF„“*⁄xvi2π>µ6zéE+k5î¢ï?_IItÒ	‰W…çG∑÷ãÖ-1Üœ0PojÏ¯Â1ÙJMx->óÈ_âuÌ3º.±[«À°ó±∏î¢9+Úd)üTtñî‰•Õz◊ÿg•˘ÓÁ∑‘⁄\yi¶<ãØt+åH>π9tò¨©◊äu˘∂>É$Œ*¯µØ⁄ª%˘ä˘^%ız—§éØm≈òjA€=x% •~	U—VàE<M9\¨K'(Æ\[û]ùﬂú_æµ∞DRüb%ÅíÁß&î(•Ñhcò¥¶kÕÙùÎØô.˚¢ò¨œ[ôkÊrWÕç·V#™Á‹˛aÀÑøN«o@$G“^—o√ıôpóa˚{∆"¡|ÿ≥w¡π∑vàiyÁ08˘˛ıı∑—‡¡ó'O?BÉæ1xç™xˇ£ìØ†¡√''ﬁÑ¿ä¡ØﬂºÛódÁ„¿å∆Á€·xsDËßoŒô˙k:UøÄsµäïıS£t±6©π{”•ƒ∞πk[çê?)!ìRéBq◊MÙ∂ãDN√ﬁdQ ˛±ò}•ñÕ.Õ.æZ[®Ω(ÆÎã¯”ç ct¿˛˚æΩY!¯‡ãˇ$FfÂ ∏{ı∫Ì∫$À€1·{¿ZxØn≥€j⁄=•òƒœzÄ€ÿdmsT0ééP€o©Û&_∆Â«ôT˘ﬁh3Ä÷—ÓˆÌ( æ≤Ø€ƒ6»¨Ê}°g;Nl˝¸”1'qÛÃ—X°á?QrGÆ¸›Z’ ?6l*ª0êãG±‰tç*∂€vœj5ÄùåÍVÃ¿sBc±»èFèÔ∆dyØœ_äâi–&‡&3ù∞pCA*™ílçfDÆ⁄]º©±∏û›–€ø<AIYÒu∂ß¡ˇ·–Æﬂ›˙∑≥]„yhgê_õŸﬁÈÔ)ˇ]„|á«ÉAgÏøﬂkv¡È£‹iÃFÿ∏ou˙ƒz{f€"˙YÔ}CMÄ±öA◊)cyisv˛ïŸ•µŸ’ÕÖπÂ•⁄∫ˇûò˘Ø;-ßG¿`§çÕ-/.Øö∑÷b\ù%±{uqŸòâµaÓu7É˚Õ¯_Ëuç¶õÙç¬#∆L◊{∫cÔaç•ım„∑Gú‹`ƒ’2Å,–≤‰Ä¬‚Ÿ$ı1ÑÛ´DˇÎ_—¡ë|ìHÖÚ7åπÜg„Ø=sŒJÿ#æˇ*«ïÃy"° ¸™ª_ıØŸ}‚©NıåXÈ i'„⁄ƒk=ˆç%|4ÁB˙#R£?9≥/Ì8Cºm˝Ê2ú;Ô~9ı8‡ÇÍﬂ›^XπU]Z€¨U◊òÏ(wÉ‡ åÉìÇ˚˙•ÿ‰ﬂD¡<Ó÷«–%ˆ5A$õÊ¯Øø˛‡¬ôíò\‰÷ïø˝Êü˛≠í8/4g∑Ï-
zNç,,gÂ_`çùæ˝Áì_<9yˆz˛Ïù”wﬂñYV.4]®÷ÕrÇÒQèè Sbg⁄Úeé„b‘áäN!¿˚àÙ„Ioë‘ó6däüí.›ùî˜â⁄ÿMŒ˚2>~+îP¿V§ÚÑ_c>d÷Ó,F+E|5êŸä’Î7Î-mÌı∞L≤iˆÇ\Ç≠g2ôŸ^œ:LMçmPÃëÕq‘‘U¶ãw†6ﬁJÅs
¨òÖrVæ°ò∂†B|ä>˜]ÍVYY 3xnJÒ`˚5I∫ H'w{›Ù≈£&V°î˜…@0x%ìcS«È%Éi»íf»xÎ÷¨ÃV©D⁄%_ªÕˇµ>Øù^ “;ô<ó∂Aï]ôÕdKBÒî•S®›ÏWuﬁ'ÆÑ]°í§g©dà‚
+ºî'K˘1≈¿jvI¢3/“Ç+éX"pØV–:†πï≥™ô2[ÑÇÒÃÀÿ)â∂’Gw·_∫Ú5[,√Üed0t∫eaMrZQ∫êIlΩòe]˘€o~˜Ó∞i†ÓíJO´MåR˚Õ˛.¢b‚Ã@8Ö>.éQ ã∏8Ë∞≤A“:}DÜ\fHp˛6èäLuZó2ìKI}d˘
!@
AQåV
 ¬ÂKπÒ‹tnºP&u¢§ÂóÂttI\9YπmŒ	“n•sæKx
†-ój√”õG1›8BHUü¥ßXÂ…·NÊc·Vj•ï•`´ÎŸLﬁn'X/rBÈ∏õt’‚6ºÈM≥!«j4Vk ;&õH•=Ì”dÍl¨∆ Ûaád<»-_ú0)dÆŒI˙SË<=îj´¿∆Wπ-É$¬P¡2zVÈãèﬂÍÇ%ÿ8jˇ¶p\"ÃÆˇ9äcFƒÁ‚#$ÉÀG”∏ºâRZâ'>
z˜“Eëoﬁ≈æP	h7\C$Ü{*é√ö≠+è9Ä4◊P⁄Wp"û`6ÉáOH-˘?ÖcÚ‡∑N˘è¥B	=13<ìs≤Ñ{ê>y`íø∞$0≥l /∑hŒiw[v≤ÆX™-◊yˇGŸÛîXné¯Ù*ˇìÏYÓÚ≤£à¡fÊ(˙ùî/ByIµ€tùÜÌ≤t1·;È;wù}⁄±Ÿ:Â´◊ße[ùîl‡ bÈ&K<0⁄î|÷»√`/!Áﬁ:‹.ê<©~kÜŒÏBxpÒÌ¶B¥ÈpYﬁÊ‚˜ZáwÏ≠æÉ’VE=w·&öôÛ=-˙}µ€ß≥d›oÓ`A¿û‰Rg^i⁄˚W3©—}˙ã,ì'¬ØÂ[z’ŸGÖl≈€‘Ø–TvT˝˛
∫aÌ·ÒÕjîu%ÀBüW—’:∞OX≠$(d~1VÊQJ†)1SD©‘nH#ïÜÌ√Ö.AÔu—KgR"$x ≈(0wﬁ5Æj™™
kTBwq
U>yIâQœˆ¸Ûøú˛Í1ÿJ·ΩAsÈÆÕÆ≠-VaØTW™KsUe°ëaÒ¯c HÕº@’íEdµ°í·ì".F”ùTv)áµU<ˆ·t-ïAîFá˚ÒƒfM*dtUó…yÿê°)7/W!™Û(>7EIá^∆*:y˙Ê…Á
ÙSV—‚˝—„Õ%Ÿn9N/ïÚc<$Ôû$‘êl”l6∂‹¸Á ùg≈
Ï¬h§qΩ|ôÙÚòˆVIl√ÔØÿÏñÇ¶ﬁcÿm°à_5)ÈhbÏf°…#Ö“ÀZÉp4Wbd2ØDm-r÷—Ú∞viì≤êej≠ZùHi‡†hç‚mØ¢Å”á‰T Ç»˘⁄≤ÙÓMªÁ ¬ 6CÂ$‘pWÊú<ﬁ◊Ìßs—¢tAç6h§GÄ'¬†ÿöúÕ÷LéÀ¨Àã∆	3≈€6b=“z^>r≈[©°koOV‚‚‚>˘9∫4UäÔ∞§Mæ(Yû/z(`‚â∂JÄø gZÔ?]D√bıïÍ"∫ΩrA=Ña◊D˘ì‰åï‹Ç≤Äóï
F=yÙ˙…≥O–‡…”¡”◊—‡´'œˇ¯)<|:¯¸˜Ë;ËÙm .=}Á|ÏÙ◊è–ÈÎD'ü?8˝…ü¿ƒjªÄS…ñ¢/;0» 
îï+¿≥ÅL‰g´®–˘¨ùn°`˜ªQêQÔ+¬2GuŒl‹“Ìf#‹˛ö¡?¶G±4èGúÈ8˚)E†Iâc‚÷¨}¸éñSß÷Ãa2PÑØ@jt˜qsªá_√ç	úe∑-6Òﬂ3§’´Ë?‘ñó2¯pÂ⁄)¸÷ıAq\#◊¡L0µ]¡ªÎêL˚vfÊcfÜMÕÿòrhàÔN¶ªÁÓ¶‘∑"Ñ€≠∞FÂ0ÙÇE¨x+¨ª—≥¢Ìu˙p∫◊‹		‘Ç±÷Ñ∆Éı‘=EQ[∞≠éû=V.€ï.ˆ8];ó@˛·›ó‚ÊsLŸ¥J©ÍS‡ùŸñ›Î´›dßáªèÿ|ü<|<¯’[œáÁ8É˜Ä}ˆ‰áo~ÚG
í|Ã—wk∞Àh∑±F
Ò ∫p–‡ÖªÍ9V`“únÓÉìˇˆàúfÆ”∑¨≤∑¿õU+£
Cuì≤’D˚ÃiŸª◊√«$U≥l‚LEXJ@FÊπwY(r#|]œ⁄y]ùúb«‹π\ß~	5rÍ{=◊È•	f[a‡∂i}4ªB<ﬁÈi	$ßT—ΩÌ⁄Ωï÷oíáA≈”!éŸFQëXY‘uuæ}“äÅÉ$Ò\,º†/ôÛ™Ë,∆ë[˛Ó:U_x%Ö§ïn¸ßŒ…√<y·‡˝éG¸ß5£ù<˝à}Mzç∞L‘fò®¯§ør7ÒËı”ü?Aªj?I#ZWò™≠^√->|2¯Ã≈|6x˙FÂãÄ^:}Ù1JÅ?Í£ßh*üô|Ó¸Ò£¡èäû˘Â…/û`·Y€@ßèﬂ8˘›èpÛj`uÃ˚÷˝Ö[È9€ÕñÌÅ‚q.)∆ë…`xã$IìúÛ¢£™·≥µ”¡<∞Ó¿œ˘‚TZD)2tW±h√˜›ÿk∂t,´ˆ}8”‚}¨‰ƒÚ=YC¢hí›∂–qªä»∆-'yX&§’˙RäÂç¡mﬂ2æX=¥ácâFÎdŒÕ∞w%¿˜pÏK˝ ˛ßòØxeMX∞4-˙Ä¿Ô;äUã¡{èàã¯Gè†(¿˝?{õîi†Œ‚‘¯¯jê•46J
‡Ì{˙ˆ£ìßo‚˚’ß†$)_4»1å∏?“°‚m[¯´‘ÒÿÉQË≥Áx¥Ûò'h¿Uõdq©8ÒÒJÃ$äwnA	ÓYbxﬂ∂Zƒ∞G7∑pKµw£øÂyåìò™,‚Ô\ﬁ	ò‰˙:ë/ôñt	1ë'qFEOÖ…ºSò:&‡‹3#Ãá=yeJc§úU¸ıóBIwYÖ>ÜI›∂†‚?K˝Zjù+j˙8G=,9•äå„!Qò!˘Áú@Óæ¸c?Ü–˙œDôñÃ˚ıåÂô∫ºGueï(Ç@A∏s≥œfyS@û–G]≈™Â2ﬁkƒy1ÃGã⁄§ ÌO¡·(Ñ€Iºñi…’á„ÈI9:æN^; ïJ#˚&lâ ‚H∂'¬ ôx#’Æ(UæDŒm∏IÊvÌ˚=kÏ∏≥S÷`ìÆ≠,∞Hs˚ö TyE∫^˛Â3îR÷ﬂã-R‘„2nÚP• y™˙Ë∆ö<é≈È"©«•nGQÚæÖºÓﬁÔnZV|T]πSæOQˇ/n»ÅÔC¡u∆ÌC5Ç.ÖõÜË[%°∫ä&«‘èí«†ÎfﬂŸ$%ÕÑì»/Â»Ôœ"—oDä°ﬂÖIæf˚˝Ç…IC°˜È »¯ÇŒpAÜÁ§<" ô,ù<K72a{)Œ¢Ìsf◊<W˘q•?!¢„*IQõ´Ô{§§ ‰nΩ_ˆ®GW…Pö–Î*çë'n÷Ω'ç–?Ë≈W1≤ÎNß·reå¬=Rp1ik∞–T–?aok™(û.˛NWì˝àE€jKä)œ6Ùä;·–À|∑°˝“+âÏøih∆2¥çÉ{6ÅùÉ=ïL7ÊÑUÜBƒX™joÖ÷j€©—›~øÎV&&0Û≥˚n¶›<∏◊ÏgÍŒeTõ.uN∏€˘Ryä¸+›ÌŸ˜Òõ2ÌnA˜≥»™Ä›*rHkû F34!/‡‚¿vıï[–W◊ÑÒz¨WnO9˘ÈgËÙüæ¸ˆÁßÔ<>˘Õßà*ÆƒhRm4˚P¸˝ﬁhûáûœ(Ô§∆ïM&Ü‹nﬂKT”FªzâL˘R$|«≈+,KN‘‚U“Y]˚˛Ê¬|eÿ9fCN;`∫Lä‰ cs?;ïG9≥{Hoì^JîBõØUÁnØV7kØ.ÕmŒ-ﬂZY¨™ˆ$¡=™˘˜˛Ï_û†âˆJœvÌN›ˆÓπ¨¯ûï©îp“∞hπ,¸
n"°√û!fçJ“^öZcƒ=ó™x° ñùmÁ*Ë•^≈´Wë,@Wl«sTFõ~Å∆$>M¸≠Xß/¸ñﬂµ≈%~ùs~WKõÆ]øÂ4`∆Ç°¡b)Ì∏∂Å5íJ+Òi†Ä5?ﬂvwHÇsæ‰ô8'“√«Ã¢V®ÏÅ¸0Õ)bë!’~d¢'∑“ ]Tã§fîamîY'D}3ºw
—¯P^jı¡ÚNå$”}´µ◊#bËµÙ:ñ}:0ôêÍ¶Àî√1<(Æ!¢
2é,E·»z1Âê‘nT∫È);& ÚÜ™˜ŒqO*£F ä– ø‚´±ÿ´∞≤8˚jus˘Í“⁄¬ıÖÍº≤h…n^Ç73"Ê÷r›†'GÈ^H!∆´ƒ˜çÜ£∂uêﬁ«É*ëQ·¶ÈÃ`§Q•Gw+4¥ro¢2.±ç–Ø~T«´À∑•˛÷›ºÅÿ1[Lá:ó•ÏŸ√ï\^YY^†∞≈ÂπÔ}À÷Q^2n¥∫TΩıÍK%S∞TôGS–M?)Ômz⁄Ò" ´ƒPÅ˜¨I}[#=Zéàik7›=í! »FÂvºº[à,>]]≥åıl¶x¥&9[∞M3õLÃÑpÚvÁ<àak'	,[8≠‡u'uâÉ¥†É¥µ◊w‡HU§ây'Ì÷{N´µe…—˝Ú~7±ÜLæÍX˝Û@æ9±iDYÀ‡è†ÕL≥q¨G⁄R'Â(áèº4mV∂%ú•Àµ†i@öµKa≤p;A¢¨3JÅuFçä∫ w)ﬂﬂﬂXÕî»i÷syÚÖEÇl“Î•â…ˇl	åN!Î√Ë‰≥„Ö)¯6ì£G⁄›≈Ω∫óVÄl)œå†˝ìêö:Mà«ˇ>FMw—©ﬂ#≈\{{ˆ±ƒ @3ÆF‘:≠Œ#&µInq7Æúà€ÈkQ¢ˆÌôòñÅ>	)iGqsô“¬MÛ»'!'„$d®)PX©4Ó˝ÉI_Ü‘$e/ëí¨•n˝ÂE¥sﬁ¶aÛ2Ñ≤‰¢æ(áÖ Bë?‰ú‚@≥≈˜o6Îµ‹<j`kHJ¬íØÑÔ Ím¬5iÍ(¶éNNXıfê√Qjjv¡µ´ §]î≤TŸöy`™v◊∂˙Ñœﬂ@Ëá^ Êh´Ÿ±≠ûÑ+Íí#ôÈ-mﬂ«2…%äóü-$—•RÀ‡z.ì'§·,ÖhU‡C…m.ˇ.XÉô≥^‹R¿¬€µµÂ[hnyÈ˙¬Í-tky~v•—íÌ§Øıˆ`è∫mTÉ¬AajÚ/±¡ÛÏ†Ê®è∑¿v≥◊&Öt3Mjöûˆø«x|Pü∆◊Fºôk[˙CyR˜çÄé ‹vòªF#“Ê∏9OÎ!Í⁄ d2	+pd*àÖ–qòÖ§±öGHQ)>iA¬*§RK.‰º3iV‰@¢ﬁ% J<†a~JÀ~/'Ö3ﬁsüú√p>ìóp¸Tñì
Ä˜÷e ÀŸ∑≈ïö¢MÇ˜„30∏X%Î;\ FãçŒµ≤pCc∏∞ª ÖX∫nRNz?=çu√i·åƒ≈œ¿é2-VRÿ¥[b»î„…#Lr(ìô∂@ÅàáòC-º\‡ú»	”±∆
 YˇkN„–hıÀ≤ÂË*ëÚd>’y ™.Ifè™Õò≥§A¨áá’∆[å˝ó'"xçÍqQ‹.◊dhÈ2‡ï)π(IOÈ?ˆIØ–1=ù£ﬁL=ÄS»IBj	≠Jõﬂ,íËDŒJ Å∏ævF†áÃîtyÆŒø~<¯1M˘òÉä»≠sJÇ3Mr®?A?™BÖÜZœa‚VCã,82_F.“Høé1—EgYÊ”wﬂº˜%Éˆ!sò<£G¸ÍºúõúKS|
p»p˜∂∑õuêoà∆]‘ÂˇdÌ)Ísm◊ÈN¨auÍv-bÒa¶∆Ç´å¡ä”›Î~´Y_•ú
˚£⁄çs”riä”D£Àü≥¢®nU£'hp‡eÛU;/ûE¡¢9ÌésÃ˘êze.PÅS5¥:]TC ïøΩLÍ∆‚>≤
ñ¬·∂ÕLª±k'Ñ9a†9P&9£zT!’£<óNjëëÛ…wY»˙#±ˆcﬁß7ÒSıãì©9ñBﬁΩˇÈÈªoßjKµ1tÚß◊|F”ój∑Ø__ò[®.≠!¸£‹©#qH4Ø0àÆIıU0CAŸIª„ÏÌÏn∫7.F•ÇÈóCív©J∫<áLööå’j£Ì&”xp•òßwÂAoÜ9**1J;J+¯IáÏ∆P¶1∞'é≤Y∫£\SßP†ü1Ar°\B≥®8„Ï.ßáÓk÷Nl‚ä*9|Ù≠â¡ü><}ÄUO4xÔãìüΩãR7HfÄˆi“`M *Âá—MË7ÜRç)(>T28~A¢:^ÉàH	%hìEô’Ù,⁄‚…√ˇÓE!í†§o™ÆX Ux4)¥›tú6bëHLM4RôE"Ì|;U¡∞uÒ,™†lá¨à≥Dc¬˘^ûÉ•ÒºHM≥¡ m2B;„ˆùÓ
û>ká»¢‡T≈∏ÚÚ*e4¨t≤s•æ&YQÅYŸáäì˘ΩÜÜ;˛Ô~z
+∏S±Ç∆Kö!Î	ì≤
%\∆‰.üÀÄó(±ã’ﬂ◊sSQß=∑àÉñ#∏û≠ 4^Zÿ!Ïùq(ﬁQOD÷·Ò§9ÌÖ6â •HÖt‘&NtèN≈˙ı "ñÒÍºAiI÷¶81™±TO7é∑tx% i$HN†z	\∂!¸uµeC6`1ØrxÏò¸‚^∆¶wí@¥;≥k’’—ptª¨€j¯Ï·‰'(∆≥jıàH”p¶G~H“Gï_z±˙@á°≈¶îS•rZNœﬁºÁ¿*hÔ!ÀÙ¸OOΩ>xÔ1:}ˇ1 Œ<ˇÍá'øxJ ©~Òd˛è(>^F™o⁄‹_$„˙Û™Ec%Jmbs®jBís;¨ôSÆ∏ûøé⁄t!j?·CruÆÏª´ßDñ¥+1@±Çå‰ã¬â!àø‡ë
≤⁄3ëbãÌ-¨3Ü¢,§Å√‘œVÆπRª9ª∫∞tcseπ∂ñ…d¬A‡˛b·„ÃÈGå\‘O†∆êRC˜öx($€öVY¶yËöE≤:RÙdQ„‰°‡ˆàﬂ∆2sDèÂ‰ﬁ*|êû.c¸¥b∑7gCMâõsB8
≠·˘‹√”`zŒ™ÔÕ-:ƒªájıƒ˛o;=¸’~¬Ù–
÷M@¬brEÀ›~≥›|-\áS/k’k0{Ñã)”Û˙K€çÌ˙vù~ØøîœÊπÜPfbÿÃ	<S-P≈"Å€
M∆◊¿=7uHw˜;09È„€·µnõ§V¯(m!9~c≥TLÒéGÒBeb ˚ÅLõ7Ol⁄ºYF≥s|Òvå:K◊o¨ŒÆ‹\ò´°ï’jznvÓfu#ƒˆ¢ßuâS∑èáÚèE Bãªµˆ™–8A–ˇ¯í I}Úˆ…Ô>&ÂΩ˛Á[Éáü°¡á?«Äpt†Ô:#G"_oÙ¨Ón≥Ó¬°X∏àÎ]¢%∞{ú†ƒÖnÂÈÎÉüù¸‰#Ù¸Àg >∞zOﬂºˇ AÔ~O+ïΩÒìÁ_^÷'0⁄¡üûæq˙Ó€d|l/¬`ø∫m«ÈÔ¢rˆ˙Jç‰√˘>2ŒnL˛@`ù¬$îµ1µlêÍÈ(˜@>ré¡3ì†2c≥N}»ö’nô.}w(‘ÄÅ√¥≥◊èö≤\àé„
Q‹ΩH@ÒOMçì%eºÀˆ™Ωåø|7j«Gddƒó:s‰;$∫Yµi7!"ù‰Í%ƒ?îÏ˙‚ÚÏ¸:˝—O?˘p˘ctÚ”gx#û>xÜN˛˙ÈªèaÔ¬dw7◊˙dÏJ¥+ivlxh·C†@“Üd›é_ñµ)](©Ê’{B≤MaÊïàè>=Â®ÚÀ—≤ß€r
NXÓÖπ?∑µÊ˚ò»15LÉ‰{àœê]Ót·∑IÂ[h∑ÌF+t≠√[âÍ»!QV¡xãz#¯~®F4˙™·ù—eVY¶bï«1s√ˇLâ™<M¶œíG¸◊“¯éô#ÜØCÓ#w¿◊ÇNJ¶]ê=Yyùû∆`=∫‘◊>t:déi˙.ªP0‰+ãÈ÷øóﬁJ5C
I∫„&÷ƒwßFaó∂lﬁ%v,tVÉºT’∑â	¿ÿtŸhmC¸1;òvπ€(∏4õö@◊3hil)M…hdtéƒ"xÜ¯û<‚É√/ºÑ©(+˙Ï„3¶≥O“-¡ã»4h{—ø†B±ﬂËÊ^∑IË£c≤…öà:
S≈
Z‹´ﬂ;§ZqT¢R0î)2∫’Ï4”∞Q7yê<¢"Ï‡éxöÔMDŒ°äò)<'ÙÔqbt§võY@´Amì¯H¿ﬂ)zÅŸM)Ó~Öx~Éo]tvbÈÆ¢ª˚Õ?ΩÅ÷O~Û˚”|»L&Ë‰∑BÈ<Z v]∫x‰è„¸¯DÈZßôi¥!ŸÜ◊“È£O†T¡ÈØzÚã˜N…W+:RÒ:≤x{Ó{Ø¢[≥ks7—jıŒÏ*ë¨z™§ﬂâÈ!•,=¬UFÔ” ôl:˛   ˇˇ‘]_oEÁS,Q•	+©ì¥â´<8âC-•µ±]™"a;Á æ≥|w%!Ú"H HPJö*?Ä
BH·ØäTÒÅ‚Àw`f˜Ó|∑ÓŒç_ËCﬂŒÏÏÌ˝nvgnvÜ˛Kç‘€9R6-;ÉŸ… ®Ü`Ù+qŒfV∂—Ïx`PE@j†l·*âTåHYÏ>Dñå[	√∏¿ã;3Ã`]X'µéﬁúPèè®Ä…œ X≠kbÙ¿™π˙ÊÙ∏œéb∞ÍﬂÅÄÜMØ∞Öñ(vπT≠íwä+µRÂ=_µñKï¿±Bq>GJ[[hì¬n6‘Â∞êπk:] æ›”_¿‡êRΩ!E2Í¢¥#Œ±X©Ø•PÅ¥Tp‘v;ÏOèÈ—Ù¸WÚ–˝Ó»Ì?∆¥˙Ó·π{Å{Ù?/ˇË´`W…=ZÙç©HTqÓ·ìAˇü$áB± Èj±V,›˜4\5KÇ‘±"h6 ÅÌX\À†ö`•;∞
±’∂¨Ÿ"|<Ú!µRÅ)tWÑvDµ≈ˆ¥0XË≤£Ÿ◊ ≈—ø†bæ>√|€W_˝B‹øœ/ˇyÉ‹ÿániÜñN~XËE\’¨fWÔ ¯{Sƒg<;w~ª:;ë î5ÇâèÚ˜·ŒÜ≤˚
0Ãè¿÷¡8(ÿÆ	(∞ˆ‡±¥_	ã9RC?kSãÚ^Ô``Ÿƒı3ÔtÎñd%Û<z
x∫d,»8^	8rT`«_®ˇ1™Í∞yä‚ÒÅ˚Ùb˝KX|>qüRp† Wü}9x~H	ÅÂŸèÓÈëG88z‚û∆kîîP…ì|πº^,¨F˙Fp‡°Ø›`¡j∏√#≥ ö……‹"µÆ3NÊg2kX†ñ¨lÉ≠-…ÓõÚî∂áHƒHR  J<Í√G#ëvAá=”ªrKQ.*÷Jîíƒöâ£¿ÌÙ%¿ÌãÛAˇ'˙IÛ”c œ}Ò◊(ô@ñÁÅx’k\#lkî√lwÉì˜€SàaÔµ“ªÖ
)≠ëZ•ò_ØíµıR©HŸ y]p`Ö∂€¯ım¨õµ¬N$ÃÃeÏaÓ:ıg¥—Ö≤¶Ô‡r$‡åQ3bÃB≠…0„àò—ì4≠•˝•£ﬂ>[†’i+ã±≈+oI©„ ´[y«6}∑F¯WXZÕl¨¬î‚µÿπª•™5ª-—ÓÄz7%
#°H†Ù…“∫ä$‹îKÜ=73ó#Ëí–‚Oda„	ëN©êB4)4Gùf‡¡¿Àz3$ULgG≥·èò°3∆‡”´n!Jï|"˝Hö’K• vÎGXX∞KØ∑—gá©∞2ñ†sŸkÇ˜/ï∆∏8ûÄ7ùNôªôÊ9ﬂmn„÷%¥X%Õ¥«¢öbØ9ynCÑˇÔI≠¿&3ºn≠∆bX	—¿Hçƒî÷£äN,ãº€·hh¯ù0˘†}v¥∫ÒÜåz*ÓaCê≈·ƒ˚§c¬˛§sÊ≠c^π9ﬂ!œúD¨)o‘wˆ`Wk·*€kJ\Ÿ<v9ÒÄv(í∆MEU…%Ä‘bç´uªæ¥?¨–Z^N7{…â9ÿ4Ì®Ï®KöAﬂ∞/…áﬂã
Ñ€ã¨ù◊óåÆ/ˆÍ›Ú.0ÆY¸æ ØU„±«Él~Mh±YÆl-√…Òk≠Ú≤¶ßâﬁ2Ãn¥ÆFÿA◊„ÓπÂÔtŸ&bËŒ$~y‡⁄X~VbJÙ‰èè•j5W`GÍ`ûúq<æ§ Tâä“*%˘ÕGuÉ~ó{€—õíä∂•·ŸZ…í„±ÍW]JôÙ¶KôFZçí^^Ÿærè˚zÆ–6··É›U∑i§TG” tÀN£IÆspÑ≈{—~<∂íﬂÓøﬂ†<ôb?òCèÀ1¶Höu∏EO:à=Y˙¶∆Á1ŒŒÅÖïÅˇ”Vy3·ÿÖxx%4™€#å
è∆Çî[Í≥/˚MÉœTËÖû}úyòùüŸêÊïí'5°1Tªò@ë≥JÀásΩpGk&¯z®)në„@z¢a⁄∞dg≤,óÔÕÈ,a·ó4yó^ÜÃ‚â·Eø~[∏àÛB$¸6ö;`^Q30G&¯† Vtﬁ]N0Ω§¥ÚB„IC_p˛˝ê”<û&&$'ZkõË“LÓÚn£ID’a4Q¥Æà(È˙ŸdöIP…EÉµ”fÂ˜ê†1≈˜êÌ»~Kcìv8¸·˝Ò=«∆S*8>ñÄî^}xŸÔà]	3$€ ^WïkbÔŒkˇ  ˇˇ v›õ