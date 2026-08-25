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
      title={language === 'ko' ? '설명 보기' : 'Show Description'}
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

  // 화면 전환 시(gameState 변경 시) 스크롤 위치를 0으로 리셋
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
      title: title || (language === 'ko' ? '알림' : 'Notice'),
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
      // 일일 미션 진행도 업데이트 (미니게임 플레이)
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

  // 하버사인 공식에 따른 위치 거리(m) 계산기
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // 지구 반경 (meters)
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
      title: language === 'ko' ? '위치 정보 권한 동의' : 'LOCATION ACCESSIBILITY REQUIREMENT',
      message: t('running_permission_prompt', language, { rewardInfo: t('running_reward_info', language) }),
      onConfirm: () => {
        if (!navigator.geolocation) {
          triggerAlert(
            language === 'ko' ? '이 브라우저는 위치 정보를 지원하지 않습니다.' : 'Geolocation is not supported by your browser.',
            language === 'ko' ? '오류' : 'ERROR'
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
      title: language === 'ko' ? '위치 정보 권한 동의' : 'LOCATION ACCESSIBILITY REQUIREMENT',
      message: t('treasure_permission_prompt', language, { rewardInfo: t('treasure_reward_info', language) }),
      onConfirm: () => {
        if (!navigator.geolocation) {
          triggerAlert(
            language === 'ko' ? '이 브라우저는 위치 정보를 지원하지 않습니다.' : 'Geolocation is not supported by your browser.',
            language === 'ko' ? '오류' : 'ERROR'
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
                        <span class="relative text-2xl">🎁</span>
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
              
              // 10m 이내로 보물상자에 접근했는지 검사
              setTreasureChests(chests => {
                let changed = false;
                const nextChests = chests.map(chest => {
                  if (!chest.isOpened) {
                    const distToChest = getDistance(latitude, longitude, chest.lat, chest.lng);
                    if (distToChest <= 10.0) {
                      changed = true;
                      
                      // 카드 획득
                      const dbCard = drawSingleCommonCard();
                      const newCard: CardData = {
                        ...dbCard,
                        id: String(dbCard.id),
                        owner: 'player',
                        level: dbCard.level || 1,
                      };
                      setRunningEarnedCards(cards => [...cards, newCard]);
                      
                      // 아이템 획득
                      const newItem = addItem ? addItem() : null;
                      
                      // 효과음
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                      
                      // 지도 마커 제거
                      if (treasureMarkersRef.current[chest.id]) {
                        treasureMarkersRef.current[chest.id].remove();
                        delete treasureMarkersRef.current[chest.id];
                      }
                      
                      // 팝업 설정 및 3초 노출
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

    // 세션 기여 보상 동기화
    if (runningEarnedSns > 0) {
      recordMatchResult('win', runningEarnedSns, undefined, 'robot');
    }

    // Generate base64 Map Image
    const base64 = generateMapBase64Image(runningCoordinates, runningDistance, runningCalories, runningEarnedSns);
    setRunningMapImage(base64);

    // 요약 모달 표시
    setShowRunningSyncSummaryModal(true);
  };



  // 러닝 대전 및 보물 대전 지도 초기화 useEffect
  useEffect(() => {
    if (gameState !== 'running' && gameState !== 'treasure') {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mapMarkerRef.current = null;
        mapPolylineRef.current = null;
      }
      // 보물상자 마커 청소
      Object.values(treasureMarkersRef.current).forEach((marker: any) => {
        if (marker) marker.remove();
      });
      treasureMarkersRef.current = {};
      return;
    }

    const mapEl = document.getElementById('running-map');
    if (!mapEl || mapInstanceRef.current) return;

    // 초기 GPS 위치정보 혹은 기본 위치정보
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

      // 만약 기존 좌표가 있다면 폴리라인 및 마커 즉시 그리기
      if (lastPositionRef.current) {
        mapMarkerRef.current = createRunningUserMarker(initialLat, initialLng);
      }

      // 보물 대전 모드이고 보물상자 목록이 있다면 지도에 마커 표시
      if (gameState === 'treasure' && treasureChests.length > 0) {
        // 기존 마커 청소 후 다시 그리기
        Object.values(treasureMarkersRef.current).forEach((marker: any) => {
          if (marker) marker.remove();
        });
        treasureMarkersRef.current = {};
        
        treasureChests.forEach(chest => {
          if (!chest.isOpened) {
            const pulseIconHtml = `
              <div class="relative flex items-center justify-center w-10 h-10">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span class="relative text-2xl">🎁</span>
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
      // 쿨다운 체크
      const cooldowns = JSON.parse(localStorage.getItem('hero_boss_cooldowns') || '{}');
      const lastFight = cooldowns[bossCardId] || 0;
      const hoursLimit = 10;
      const isCooldown = Date.now() - lastFight < hoursLimit * 60 * 60 * 1000;

      if (isCooldown) {
        triggerAlert(t('field_boss_cooldown_warn', language), language === 'ko' ? '경고' : 'WARNING');
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
          `⚔️ ${attackerName} (${dirLabel}: ${statVal}) -> ${targetName} : -${damage} HP`
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
            language === 'ko' ? "보스를 처치했습니다! 400 SNS를 획득합니다." : "Boss defeated! Earned 400 SNS.",
            language === 'ko' ? '성공' : 'SUCCESS'
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

  // 전투 완료 → 현재 스토리 컨텍스트 기준으로 1회만 진행도 갱신
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

    // 스토리 모드 대전이거나, 장비로 감지된 활성 스킬이 없는 경우 기본 스킬(1: 강화 함성, 5: 약화 함정, 8: 체인지 내카드) 제공
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
      case 1: // 강화 함성
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

      case 2: // 약화 저주
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

      case 3: // 변화 함성
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

      case 4: // 변화 저주
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

      case 5: // 약화 함정
        showToast(language === 'ko' ? '약화할 위치를 선택하세요.' : 'Select a position to weaken.');
        setActiveTrapMode('weaken_trap');
        break;

      case 6: // 강화 함정
        showToast(language === 'ko' ? '강화할 위치를 선택하세요.' : 'Select a position to reinforce.');
        setActiveTrapMode('reinforce_trap');
        break;

      case 7: // 체인지 상대카드
        showToast(language === 'ko' ? '변경할 적 카드를 선택하세요.' : 'Select an enemy card to change.');
        setActiveTrapMode('change_opponent');
        break;

      case 8: // 체인지 내카드
        showToast(language === 'ko' ? '변경할 내 카드를 선택하세요.' : 'Select your card to change.');
        setActiveTrapMode('change_player');
        break;
    }
  };

  const [pvpExitCountdown, setPvpExitCountdown] = useState<number | null>(null);

  useEffect(() => {
    // 상대방 SNS가 0이 되었을 때(hasExhausted === true)에만 자동 퇴장 3초 카운트다운 발동
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
          ? `🛡️ [세력 결속 (Faction Synergy)] [${deckFactionSynergy.faction.toUpperCase()}] 세력 영웅 ${deckFactionSynergy.count}명 편성으로 전 팀원 결속 버프 발동!`
          : `🛡️ [FACTION SYNERGY] ${deckFactionSynergy.count}x [${deckFactionSynergy.faction.toUpperCase()}] heroes activated Team Bond (+1 Stats)!`,
          'system'
        );
      }

      // Item 355: Random Mana Spring spawn (30% chance on random board slot)
      if (Math.random() < 0.30) {
        const springSlot = Math.floor(Math.random() * 9);
        setManaSpringTileIndex(springSlot);
        addLog(language === 'ko'
          ? `💧 [마나샘 발견] ${springSlot + 1}번 구역에 고대 마나샘이 솟아납니다! 점령 시 스탯 +2 및 +10 SNS 보너스!`
          : `💧 [MANA SPRING] Ancient Mana Spring active on Sector ${springSlot + 1}! Claim for +2 Stats & +10 SNS!`,
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
          ? `☣️ [독기 늪지대 발생] ${hazardSlot + 1}번 구역에 맹독 안개가 드리웁니다! (지속성 카드로 정화 가능)`
          : `☣️ [POISON SWAMP HAZARD] Toxic miasma at Sector ${hazardSlot + 1}! (Cleanse with Earth cards)`,
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
        addLog(language === 'ko' ? '⚡ [언더독 매치] 전력 열세 상황입니다! 수동 승리 시 언더독 보너스 +20% 지급!' : '⚡ [UNDERDOG MATCH] Power deficit detected! Win manually for +20% Underdog Bounty!', 'system');
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
          ? `🔥 [분노 각성 타일 점화] 7턴 개시! ${chosen + 1}번 구역이 분노의 불꽃으로 각성합니다! (배치 시 전 방향 파워 +3 폭주!)`
          : `🔥 [RAGE SPARK IGNITED] Turn 7 reached! Sector ${chosen + 1} ignited with Rage Spark (+3 all-directional power)!`,
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
              ? `🪙 [보물 도둑 고블린 난입] ${chosenSlot + 1}번 구역에 고블린 출현! 1턴 내 캡처 시 보너스 획득!` 
              : `🪙 [LOOT GOBLIN AMBUSH] Goblin appeared on Sector ${chosenSlot + 1}! Capture for bonus SNS!`, 
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
                {language === 'ko' ? '확인' : 'Confirm'}
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
      id: 'rules-ex1', imageIndex: 1, title: '예시 카드', title_en: 'Example Card',
      title_dis: 'EXAMPLE', stats: [7, 6, 2, 3],
      level: 1, exp: 0, rarity: 'normal' as const,
    };
    const c2: CardData = {
      id: 'rules-ex2', imageIndex: 2, title: '상대 카드', title_en: 'Opponent Card',
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
                {language === 'ko' ? '게임 규칙' : 'GAME RULES'}
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
                    {language === 'ko' ? '각 카드는 상하좌우 4방향의 숫자를 가집니다.' : 'Each card has 4 directional numbers (Top, Right, Bottom, Left).'}
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
                      ? '내 카드의 숫자가 인접한 상대 카드보다 크면 캡처합니다.' 
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
                      ? '→ 내 오른쪽 숫자(6)가 상대 왼쪽 숫자(2)보다 크므로 상대 카드를 캡처!'
                      : '→ Your Right(6) > Enemy Left(2) → Enemy card captured!'}
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
                        ? '9칸이 모두 차면 점수로 승패 결정' 
                        : 'When all 9 slots are filled, highest score wins.'}
                    </p>
                    <div className="flex gap-3 text-[11px] font-semibold mt-2">
                      <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                        {language === 'ko' ? '5:4 선공=무승부' : '5:4(1st)=Draw'}
                      </span>
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                        {language === 'ko' ? '5:4 후공=승리' : '5:4(2nd)=Win'}
                      </span>
                      <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                        {language === 'ko' ? '6:3↑ 즉시승리' : '6:3+ = Instant Win'}
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
                  {language === 'ko' ? '확인' : 'GOT IT'}
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
        // AI대전에서는 패배하더라도 소량의 SNS(5)를 지급
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
        language === 'ko' ? '자기 자신과는 대전할 수 없습니다.' : 'You cannot battle yourself.',
        language === 'ko' ? '알림' : 'NOTICE'
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
      analysisMsg = language === 'ko' ? "매트릭스 스캐닝 완료. 전술 버퍼 로딩 중..." : "Matrix scanning complete. Tactical buffer loading...";
    } else if (worstThreat) {
      if (finalProb < 45) {
        analysisMsg = language === 'ko' 
          ? `경고: 판세 열세 감지. 적의 ${pName} 위협 레벨 상승. 우회 전술 서치 중.`
          : `Warning: Tactical deficit. Enemy ${pName} threat level high. Searching bypass paths.`;
      } else if (finalProb > 70) {
        analysisMsg = language === 'ko'
          ? `분석 완료: 아군 포지셔닝 점유율 70% 돌파. 안정적 콤보 방벽 유지 권장.`
          : `Analysis: Allied positioning exceeds 70%. Recommended to maintain stable combo walls.`;
      } else {
        analysisMsg = language === 'ko'
          ? `감지: 상대 ${pName} 카드의 허점 스캔 중. 배치 콤보 시뮬레이션 가동.`
          : `Detected: Scanning weak points of enemy ${pName}. Deploying combo simulation.`;
      }
    } else {
      analysisMsg = language === 'ko' ? "실시간 연산 커널 작동 중. 최적의 경로를 탐색하고 있습니다." : "Real-time kernel active. Searching for optimal placement paths.";
    }

    setOperatorLogs(prev => {
      const next = [analysisMsg, ...prev].slice(0, 15);
      return Array.from(new Set(next));
    });

    if ([7, 5, 3].includes(emptyCells) && !operatorPrompt) {
      const isKo = language === 'ko';
      setOperatorPrompt({
        question: isKo 
          ? `[돌발 질문] 마스터, 승률 확보를 위해 AI 전술 모드를 어떻게 전환할까요?` 
          : `[Tactic Shift] Master, how shall we shift our tactical operator mode?`,
        options: [
          { 
            label: isKo ? '공격형 (공격력 임시 버프 +2)' : 'Aggressive (+2 CP Virtual Buff)', 
            strategy: 'aggressive' 
          },
          { 
            label: isKo ? '방어형 (가장자리 차단 전술)' : 'Defensive (Edge block)', 
            strategy: 'defensive' 
          },
          { 
            label: isKo ? '밸런스 (최적 시뮬레이션 유지)' : 'Balanced (Maintain optimal)', 
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
      msg = isKo ? "오퍼레이터: 전술 모드가 공격형으로 개편되었습니다. 버프 적용 완료." : "Operator: Shifted to Aggressive. Virtual buff applied.";
    } else if (strategy === 'defensive') {
      msg = isKo ? "오퍼레이터: 전술 모드가 방어형으로 개편되었습니다." : "Operator: Shifted to Defensive.";
    } else {
      msg = isKo ? "오퍼레이터: 전술 모드가 밸런스형으로 개편되었습니다." : "Operator: Shifted to Balanced.";
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

  // 전투 패배 (winner === 'ai') 5초 카운트다운 후 자동 닫힘 (로비로 퇴장)
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

  // 패배 팝업 5초 자동 닫힘 타이머
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

  // 던전 전투 패배 5초 자동 닫힘 타이머
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
        addLog(language === 'ko' ? `[맞고대전] ${firstTurn === 'player' ? '사용자' : 'AI'} 선공으로 배틀 시작` : `Matgo Battle started with ${firstTurn}'s turn`, 'system');
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
        addLog(language === 'ko' ? `${firstTurn === 'player' ? '사용자' : 'AI'} 선공으로 배틀 시작` : `Battle started with ${firstTurn} turn`, 'system');
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
        ? `✨ [스킬 발동] [${cardTitle}]의 '전체 고양': 아군 카드 스탯 +${card.ability.value} 버프!`
        : `✨ [SKILL] [${cardTitle}]'s 'Omniboost': All ally cards +${card.ability.value} stats!`;
    } else if (card.ability.type === 'TIME_WARP') {
      activationText = language === 'ko'
        ? `✨ [스킬 발동] [${cardTitle}]의 '시간 왜곡': 상대방 다음 턴 스킵!`
        : `✨ [SKILL] [${cardTitle}]'s 'Time Warp': Opponent's next turn skipped!`;
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
            ? `✨ [스킬 발동] [${cardTitle}]의 '파워 증폭': [${neighborTitle}] 스탯 +${card.ability.value}`
            : `✨ [SKILL] [${cardTitle}]'s 'Power Boost': [${neighborTitle}] +${card.ability.value} stats`;
        } else if (card.ability?.type === 'WEAKEN' && neighbor.owner !== card.owner) {
          if (neighbor.ability?.type === 'IMMUNITY') {
             // IMMUNITY blocks Weaken
             addLog(language === 'ko'
               ? `🛡️ [스킬 방어] [${neighborTitle}]의 '면역': 약화 디버프 무효화!`
               : `🛡️ [SKILL BLOCK] [${neighborTitle}]'s 'Immunity': Weaken resisted!`, 'info');
             return;
          }
          boardState[ni] = { ...neighbor, stats: neighbor.stats.map(s => Math.max(0, s - card.ability!.value)) as [number, number, number, number] };
          triggerStatFX(ni, `-${card.ability!.value}`, false);
          activationText = language === 'ko'
            ? `✨ [스킬 발동] [${cardTitle}]의 '약화 디버프': [${neighborTitle}] 스탯 -${card.ability.value}`
            : `✨ [SKILL] [${cardTitle}]'s 'Weaken': [${neighborTitle}] -${card.ability.value} stats`;
        } else if (card.ability?.type === 'REINFORCE' && neighbor.owner === card.owner) {
          const currentSelf = boardState[index]!;
          boardState[index] = { ...currentSelf, stats: currentSelf.stats.map(s => s + card.ability!.value) as [number, number, number, number] };
          triggerStatFX(index, `+${card.ability!.value}`, true);
          activationText = language === 'ko'
            ? `✨ [스킬 발동] [${cardTitle}]의 '자체 강화': 스탯 +${card.ability.value}`
            : `✨ [SKILL] [${cardTitle}]'s 'Reinforce': Self stat +${card.ability.value}`;
        } else if (card.ability?.type === 'WALL') {
          activationText = language === 'ko'
            ? `🛡️ [스킬 효과] [${cardTitle}]의 '철벽 방어': 물리 공격 차단 태세`
            : `🛡️ [SKILL] [${cardTitle}]'s 'Wall': Block stance active`;
        } else if (card.ability?.type === 'PIERCE') {
          activationText = language === 'ko'
            ? `⚡ [스킬 효과] [${cardTitle}]의 '관통': 상대방 방어 태세 무시`
            : `⚡ [SKILL] [${cardTitle}]'s 'Pierce': Ignores enemy shields`;
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
          ? `💧 [마나샘 점령] ${index + 1}번 구역 마나샘을 점령했습니다! 모든 방향 능력치 +2 및 +10 SNS 보너스 확보!`
          : `💧 [MANA SPRING] Captured Mana Spring on Sector ${index + 1}! All stats +2 & +10 SNS bounty secured!`,
          'system'
        );
      } else {
        addLog(language === 'ko'
          ? `💧 [AI 마나샘 점령] AI가 ${index + 1}번 구역 마나샘을 점령했습니다!`
          : `💧 [AI MANA SPRING] AI secured Mana Spring on Sector ${index + 1}!`,
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
        ? `🔥 [분노 각성 폭주] [${unitName}] 카드가 분노 각성 타일의 힘으로 전 방향 파워 +3 폭주 상태에 돌입했습니다!`
        : `🔥 [RAGE SPARK FRENZY] [${unitName}] empowered by Rage Spark (+3 All Stats)!`,
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
                triggerStatFX(pushIdx, '🌪️ GUST', false);
                const victimName = getFormattedCardName(adjCard, language);
                addLog(language === 'ko'
                  ? `🌪️ [윈드 거스트] 풍속성 돌풍으로 [${victimName}] 카드가 ${pushIdx + 1}번 구역으로 밀려났습니다!`
                  : `🌪️ [WIND GUST] Gale knocked [${victimName}] backwards into Sector ${pushIdx + 1}!`,
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
      triggerStatFX(4, '🔄 SWITCH', true);
      addLog(language === 'ko'
        ? `🔄 [속성 스위치 (Element Switch)] 중앙 제어 타일에 카드가 배치되어 십자 방향 속성이 순환 전환됩니다! (물→불→바람→대지)`
        : `🔄 [ELEMENT SWITCH] Center core activated! Cross element tiles shifted!`,
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
          const attackerOwner = placedCard.owner === 'player' ? (language === 'ko' ? '플레이어' : 'Player') : (language === 'ko' ? 'AI' : 'AI');
          const attackerTitle = getFormattedCardName(detail.attacker, language);
          const victimTitle = getFormattedCardName(detail.victim, language);
          const pwrAtk = Math.round(detail.myStat);
          const pwrDef = Math.round(detail.oppStat);
          const diff = Math.round(detail.damageDiff);
          const sec = detail.index + 1;

          if (language === 'ko') {
            addLog(`⚔️ [전투] ${attackerOwner}의 [${attackerTitle}](파워 ${pwrAtk})가 ${sec}번 구역 [${victimTitle}](파워 ${pwrDef}) 공격! (대미지 차이: +${diff}) → ${victimTitle} 캡처!`, 'capture');
          } else {
            addLog(`⚔️ [COMBAT] ${attackerOwner}'s [${attackerTitle}](PWR ${pwrAtk}) attacked Sector ${sec} [${victimTitle}](PWR ${pwrDef})! (Diff: +${diff}) → ${victimTitle} Captured!`, 'capture');
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
          addLog(`📜 [비밀 업적 달성] [${unlocked.titleKo}] 골든 스탬프를 획득했습니다!`, 'victory');
        }
      }

      // Item 400: Double Weakness Break check for Boss Raids
      if (isBossActive && placedCard.owner === 'player' && flippedIndices.length >= 2) {
        setHasTriggeredDoubleBreak(true);
        const unlocked = unlockSecretStamp('DOUBLE_WEAKNESS_BREAKER');
        if (unlocked) {
          addLog(`📜 [비밀 업적 달성] [${unlocked.titleKo}] 보스 2연속 약점 파쇄!`, 'victory');
        }
      }

      // Item 386: Cross Domination (4 simultaneous flips)
      if (flippedIndices.length >= 4) {
        setIsCrossDominationActive(true);
        setTimeout(() => setIsCrossDominationActive(false), 2000);
        addLog(language === 'ko'
          ? '✨ [크로스 도미네이션 (Cross Domination)] 4방향 십자 동시 캡처 충격파 폭발!'
          : '✨ [CROSS DOMINATION] 4-way cross simultaneous capture shockwave triggered!',
          'victory'
        );
      }

      // Item 388: Fever Mode Combo accumulation (2x currency multiplier)
      if (placedCard.owner === 'player' && flippedIndices.length > 0) {
        setFeverMeter(prev => {
          const next = prev + flippedIndices.length;
          if (next >= 3 && prev < 3) {
            addLog(language === 'ko'
              ? '🔥 [피버 타임 (Fever Mode) 발동] 황금 불꽃 활성화! 전투 보상 재화 2배 적용!'
              : '🔥 [FEVER MODE ACTIVATED] Golden flames roaring! 2x Reward multiplier active!',
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
      addLog(language === 'ko' ? '방어 성공! 카드가 원래 소유권을 유지했습니다.' : 'DEFENSE SUCCESS! Position held.', 'system');
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
      ? `[맞고] 배틀 종료. 최종 점수 - 나: ${pScore}점 vs AI: ${aScore}점`
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
              ? `[맞고] 뒤집은 카드(${middleCard.title})가 보드의 ${matchedCardName}와 짝이 맞아 1점을 획득했습니다!`
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
                ? `[맞고] 보드가 가득 차서 뒤집힌 카드(${middleCard.title})가 버려졌습니다.`
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
              ? `[맞고] 3장의 종족(${middleCard.title})이 같아 겹쳐진 채로 유지됩니다. (설사)`
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
              ? `[맞고] 겹친 카드 짝이 맞아 1점을 획득했습니다!`
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
                ? `[맞고] 보드가 가득 차서 뒤집힌 카드(${middleCard.title})가 버려졌습니다.`
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
        ? '💰 [보물 고블린 포획!] 보너스 +25 SNS 토큰을 획득했습니다!' 
        : '💰 [LOOT GOBLIN CAPTURED!] Bonus +25 SNS Tokens earned!', 
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
          ? `🌿 [대지 정화 (Earth Purify)] 지속성 카드의 정화력으로 ${poisonSwampTileIndex + 1}번 구역의 독기가 비옥한 대지로 정화되었습니다! (+1 PWR)`
          : `🌿 [EARTH PURIFY] Earth energy cleansed Sector ${poisonSwampTileIndex + 1}! (+1 PWR)`,
          'victory'
        );
      } else if (boardIdx === poisonSwampTileIndex) {
        addLog(language === 'ko'
          ? `☣️ [독기 노출] ${boardIdx + 1}번 구역의 독기로 인해 카드가 부식 상태이상에 걸렸습니다.`
          : `☣️ [TOXIC EXPOSURE] Unit placed in Sector ${boardIdx + 1} suffers miasma decay.`,
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
        showToast(language === 'ko' ? '중앙 덱은 선택할 수 없습니다.' : 'Cannot select the middle deck.');
        return;
      }
      const selectedCard = playerHand[selectedCardIdx];
      if (!selectedCard) return;
      const targetCard = board[droppedIdx];
      if (targetCard) {
        const selectedTribe = getNormalizedElement(selectedCard);
        const targetTribe = getNormalizedElement(targetCard);
        if (selectedTribe !== targetTribe) {
          showToast(language === 'ko' ? '같은 종족의 카드 위에만 놓을 수 있습니다.' : 'Can only place on cards of the same elements/races.');
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
              addLog(language === 'ko' ? `TP 판정: ${pPower} vs ${aPower}` : `TP Decision: ${pPower} vs ${aPower}`, finalWinner === 'player' ? 'victory' : 'defeat');
            } else if (aScore === 5 && pScore === 4 && firstTurn === 'ai') {
              // AI had first turn advantage -> TP tiebreaker
              finalWinner = (pPower >= aPower) ? 'player' : 'ai';
              addLog(language === 'ko' ? `TP 판정: ${pPower} vs ${aPower}` : `TP Decision: ${pPower} vs ${aPower}`, finalWinner === 'player' ? 'victory' : 'defeat');
            } else if (pScore > aScore) {
              finalWinner = 'player';
            } else if (aScore > pScore) {
              finalWinner = 'ai';
            } else {
              // Exact tie in score (e.g. 4.5 vs 4.5? no, but fallback)
              finalWinner = (pPower >= aPower) ? 'player' : 'ai';
              addLog(language === 'ko' ? `TP 판정: ${pPower} vs ${aPower}` : `TP Decision: ${pPower} vs ${aPower}`, finalWinner === 'player' ? 'victory' : 'defeat');
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
              const resultText = finalWinner === 'player' ? '승리' : (finalWinner === 'ai' ? '패배' : '무승부');
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
              
              // 압도적 승리 및 3배수 연승 판정 (연속대전 중)
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
                  ? `⚡ [스피드 어택 클리어] 평균 ${Math.round(avgPlayerLatency / 100) / 10}초 내 신속한 수동 결정으로 보너스 +15% 획득!` 
                  : `⚡ [SPEED ATTACK CLEAR] Fast manual moves (${Math.round(avgPlayerLatency / 100) / 10}s avg) granted +15% bonus!`, 
                  'victory'
                );
              }

              // Item 352: Underdog Reversal Bounty (+20% for winning with inferior combat power)
              if (isUnderdogMatch && !isAutoBattle && resultType === 'win') {
                setUnderdogBountyClaimed(true);
                const underdogBonus = Math.max(1, Math.ceil(baseReward * 0.20));
                myFinalReward += underdogBonus;
                addLog(language === 'ko'
                  ? `🏆 [언더독 승리 바운티] 전투력 열세를 극복하고 승리하여 +20% 추가 보상 지급!`
                  : `🏆 [UNDERDOG BOUNTY] Overcame power deficit for +20% bounty reward!`,
                  'victory'
                );
              }

              // Item 355: Mana Spring Claimed Bonus (+10 SNS)
              if (manaSpringClaimed && resultType === 'win') {
                myFinalReward += 10;
                addLog(language === 'ko'
                  ? `💧 [마나샘 점령 보너스] 전장 마나샘 확보로 +10 SNS 추가 지급!`
                  : `💧 [MANA SPRING BONUS] Secured Mana Spring for +10 SNS!`,
                  'victory'
                );
              }

              // Item 356: Elemental Master Combo Bonus (+15 SNS)
              if (hasTriggeredElementalCombo && resultType === 'win') {
                myFinalReward += 15;
                addLog(language === 'ko'
                  ? `🔥 [엘리멘탈 마스터] 4속성 순환/원소 콤보 달성으로 +15 SNS 추가 지급!`
                  : `🔥 [ELEMENTAL MASTER] Elemental Synergy Combo achieved for +15 SNS!`,
                  'victory'
                );
              }

              // Item 360: Ironclad Defender Bonus (0 captures suffered, +20 SNS + Rare item fragment)
              if (resultType === 'win' && playerCardsCapturedByAi.current === 0) {
                setIsIroncladWin(true);
                myFinalReward += 20;
                addItem?.('rare');
                addLog(language === 'ko'
                  ? `🛡️ [철벽 방어자 (Ironclad Defender)] 무피격 완벽 방어 승리! 상급 룬 파편 및 +20 SNS 획득!`
                  : `🛡️ [IRONCLAD DEFENDER] Flawless 0-capture defense victory! Rare Rune Fragment +20 SNS earned!`,
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
                  ? `🎖️ [군단 사령관 (Legion Commander)] 동일 소속 5인 순수 덱 수동 완파! 전술 비전서 및 +25 SNS 획득!`
                  : `🎖️ [LEGION COMMANDER] Pure single-faction 5-card manual victory! Tactical Grimoire +25 SNS earned!`,
                  'victory'
                );
              }

              // Item 368: Survival Master Reversal Bonus (1 card left clutch comeback, +30 SNS + Special Chest)
              if (resultType === 'win' && !isAutoBattle && minFriendlyCardsCount.current <= 1) {
                myFinalReward += 30;
                addItem?.('epic');
                addLog(language === 'ko'
                  ? `🔥 [서바이벌 마스터 (Survival Master)] 아군 1장 잔여 절체절명 위기 수동 대역전승! 서바이벌 상자 및 +30 SNS 획득!`
                  : `🔥 [SURVIVAL MASTER] 1-card clutch comeback manual victory! Survival Chest +30 SNS earned!`,
                  'victory'
                );
              }

              // Item 372: Shield Crusher Bounty (3+ shield breaks, +25 SNS + Enchantment Ore)
              if (resultType === 'win' && !isAutoBattle && bossShieldBreaksCount.current >= 3) {
                setIsShieldCrusherWin(true);
                myFinalReward += 25;
                addItem?.('rare');
                addLog(language === 'ko'
                  ? `🛡️💥 [실드 크러셔 (Shield Crusher)] 적 방어막 3회 파쇄 완승! 강화 광석 상자 및 +25 SNS 획득!`
                  : `🛡️💥 [SHIELD CRUSHER] 3+ barrier breaks victory! Enchantment Ore Crate +25 SNS earned!`,
                  'victory'
                );
              }

              // Item 376: Mirror Master Victory Bounty (Zero elemental advantage bonuses used, 6:3+ decisive win)
              const friendlyWinsCount = finalBoard.filter(c => c?.owner === 'player').length;
              if (resultType === 'win' && !isAutoBattle && elementBonusCountUsed.current === 0 && friendlyWinsCount >= 6) {
                myFinalReward += 25;
                addItem?.('epic');
                addLog(language === 'ko'
                  ? `🪞 [미러 마스터 (Mirror Master)] 상성 우위 없이 순수 수싸움 6:3+ 완승! 고대 룬 강화제 및 +25 SNS 획득!`
                  : `🪞 [MIRROR MASTER] Pure mirror tactical 6:3+ victory with zero elemental bonus! Ancient Rune Enhancer +25 SNS earned!`,
                  'victory'
                );
              }

              // Item 380: Clutch Ace Breaker Trophy (Final 9th-turn 3+ flip clutch comeback)
              if (resultType === 'win' && !isAutoBattle && isClutchAceBreaker.current) {
                myFinalReward += 50;
                addItem?.('legendary');
                addLog(language === 'ko'
                  ? `👑 [에이스 브레이커 (Clutch Ace Breaker)] 9턴 마지막 1타 3캡처 대역전승! 신화 룬 코어 및 +50 SNS 획득!`
                  : `👑 [CLUTCH ACE BREAKER] Final 9th-turn 3-tile comeback win! Mythic Rune Core +50 SNS earned!`,
                  'victory'
                );
              }

              // Item 382: Total Eclipse Domination (9:0 full board capture)
              if (resultType === 'win' && friendlyWinsCount === 9) {
                setIsTotalEclipseWin(true);
                myFinalReward += 50;
                addItem?.('legendary');
                addLog(language === 'ko'
                  ? `🌑 [토탈 이클립스 도미네이션] 9:0 전장 100% 완전 장악! 신화 전리품 및 +50 SNS 획득!`
                  : `🌑 [TOTAL ECLIPSE DOMINATION] 9:0 100% full-board capture victory! Mythic Loot +50 SNS earned!`,
                  'victory'
                );
              }

              // Item 388: Fever Mode 2x Currency Multiplier
              if (isFeverMode && resultType === 'win') {
                myFinalReward = Math.round(myFinalReward * 2);
                addLog(language === 'ko'
                  ? `🔥 [피버 타임 보너스] 피버 콤보 효과로 최종 보상 재화 2배(+100%) 증폭 적용!`
                  : `🔥 [FEVER TIME BONUS] 2x Currency multiplier applied to total battle bounty!`,
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
                  addLog(`✨ [영웅 골든 마스터리 해금] 50승 달성으로 특별 골든 스킨이 개방되었습니다!`, 'victory');
                }
                if (newlyUnlockedCommander.length > 0) {
                  addLog(`🎙️ [사령관 마스터리 해금] 100회 출전 달성으로 전용 보이스 & 사령관 배지가 부여되었습니다!`, 'victory');
                }
              }

              // Item 397: Secret Stamp Real-time Verification
              if (resultType === 'win') {
                // 1. Perimeter Sweep (8 edge tiles occupied by player)
                const perimeterIndices = [0, 1, 2, 3, 5, 6, 7, 8];
                const isPerimeterClean = perimeterIndices.every(idx => finalBoard[idx]?.owner === 'player');
                if (isPerimeterClean) {
                  const stamp = unlockSecretStamp('PERIMETER_SWEEP');
                  if (stamp) addLog(`📜 [비밀 업적] [${stamp.titleKo}] 외곽선 완전 포위 섬멸 스탬프 달성!`, 'victory');
                }

                // 2. Clutch 1-Point Victory (5:4)
                if (pScore === 5 && aScore === 4) {
                  const stamp = unlockSecretStamp('CLUTCH_ONE_HP');
                  if (stamp) addLog(`📜 [비밀 업적] [${stamp.titleKo}] 1점 차이 기적의 역전 스탬프 달성!`, 'victory');
                }

                // 3. Speed Demon (<25s)
                if (Date.now() - battleStartTime <= 25000) {
                  const stamp = unlockSecretStamp('SPEED_DEMON');
                  if (stamp) addLog(`📜 [비밀 업적] [${stamp.titleKo}] 25초 이내 전광석화 승리 스탬프 달성!`, 'victory');
                }

                // 4. Mono-Element Purist
                if (isPureFactionDeck) {
                  const stamp = unlockSecretStamp('ELEMENT_PURIST');
                  if (stamp) addLog(`📜 [비밀 업적] [${stamp.titleKo}] 단일 원소 순혈 승리 스탬프 달성!`, 'victory');
                }
              }

              // Item 400: Double Weakness Breaker Crate
              if (hasTriggeredDoubleBreak && resultType === 'win') {
                myFinalReward += 30;
                addItem?.('epic');
                addLog(language === 'ko'
                  ? `💎 [더블 브레이커 크레이트] 보스 2연속 약점 파쇄 성공으로 에픽 크레이트 및 +30 SNS 지급!`
                  : `💎 [DOUBLE BREAKER CRATE] Double boss weak-point broken! Epic Crate +30 SNS earned!`,
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
                  ? `♻️ [자동 분해 스마트 필터] 획득한 일반 N/R 카드가 골드 및 강화 가루로 즉시 분해 환전되었습니다.`
                  : `♻️ [AUTO-DISASSEMBLE] N/R cards recycled into Gold & Powder automatically.`,
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
                    ? `🛡️ [스마트 룬 장착] 장착 가능한 4세트 룬이 발견되었습니다! 덱 화면에서 원탭으로 풀장착하세요.`
                    : `🛡️ [SMART RUNE NOTICE] 4-set equippable runes ready for quick full equip!`,
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
                    ? `⚡ [전광석화의 지휘관] 30초 이내 스피드런 5회 달성! 주간 상위 5% 전격 번개 오라가 활성화되었습니다.`
                    : `⚡ [LIGHTNING COMMANDER] 5 speedrun victories under 30s! Lightning Battle Aura unlocked.`,
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
                    ? `🎯 [스마트 조각 전환] 스테이지 ${currentStageId} 목표 조각(10/10) 달성! 다음 스테이지 ${currentStageId + 1}로 자동 이동합니다.`
                    : `🎯 [SMART TARGET SWITCH] Stage ${currentStageId} goal reached! Auto-routing to Stage ${currentStageId + 1}.`,
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
                  // 상대 SNS 정보가 없거나 0인 랭킹 상대도 승리 보상은 지급한다.
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

                // AI 대전(robot)일 때는 상대방 AI 유저 오브젝트 전적이나 SNS를 건드리지 않음
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
        
        // 지도를 거치지 않고 곧바로 일반 던전 5대5 카드 배틀 시작
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
      title: language === 'ko' ? '복셀 광산 디펜스' : 'Voxel Mining Defense',
      icon: Pickaxe,
      color: 'from-emerald-600 to-teal-700',
      image: '/minigame_defense.png',
      characterId: 24,
      action: () => {
        setGameState('voxeldefense');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D DEF',
      guide: language === 'ko' ? 'Three.js 3D 복셀 월드에서 광물을 채굴하고 방어벽과 터렛을 건설해 몬스터 웨이브를 막아내세요.' : 'Mine ores, build walls and turrets in 3D voxel sandbox to defend the core!'
    },
    {
      id: 'pixelstrike',
      title: language === 'ko' ? '3D 픽셀 스트라이크' : 'Pixel Strike Arena',
      icon: Crosshair,
      color: 'from-rose-600 to-red-700',
      image: '/minigame_shooting.png',
      characterId: 25,
      action: () => {
        setGameState('pixelstrike');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D FPS',
      guide: language === 'ko' ? '1인칭 3D 픽셀 FPS 아레나에서 권총, 샷건, 라이플, 스나이퍼로 AI 봇들과 8인 데스매치를 펼치세요.' : 'Classic 3D voxel FPS deathmatch with 4 swappable weapons and AI bots!'
    },
    {
      id: 'voxelparkour',
      title: language === 'ko' ? '3D 스카이 파쿠르' : 'Voxel Sky Parkour',
      icon: Footprints,
      color: 'from-sky-500 to-indigo-600',
      image: '/minigame_cardjumper.png',
      characterId: 26,
      action: () => {
        setGameState('voxelparkour');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D JUMP',
      guide: language === 'ko' ? '공중 부유섬 25개 복셀 발판(슬라임 탄성, 얼음, 체크포인트)을 돌파하는 타임어택 플랫포머입니다.' : '3D sky platformer with bounce pads, ice blocks, and time-attack checkpoints!'
    },
    {
      id: 'tower_trials',
      title: language === 'ko' ? '시련의 탑 50층' : 'Tower of Trials',
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
      guide: language === 'ko' ? '50층 무한 타워를 정복하고 층별 대량의 SNS 포인트와 희귀 룬 보상을 획득하세요.' : 'Climb 50 floors of trial tower for massive SNS and rare rune rewards!'
    },
    {
      id: 'treasure_dart',
      title: language === 'ko' ? '황금 보물 다트' : 'Treasure Dart',
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
      guide: language === 'ko' ? '정밀한 타이밍으로 회전하는 황금 과녁에 다트를 던져 잭팟 보상을 획득하세요.' : 'Hit the rotating golden bullseye to claim jackpot rewards!'
    },
    {
      id: 'expedition',
      title: language === 'ko' ? '8시간 원정대' : 'Offline Expedition',
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
      guide: language === 'ko' ? '히어로 파티를 원정에 파견하여 오프라인 상태에서도 자동으로 전리품을 파밍하세요.' : 'Dispatch hero party to automatically farm offline loot for up to 8 hours!'
    },
    {
      id: 'beastarium',
      title: language === 'ko' ? '몬스터 비스티아리움' : 'Monster Beastarium',
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
      guide: language === 'ko' ? '전투에서 조우한 몬스터를 도감에 수집하고 귀여운 동행 펫으로 육성하세요.' : 'Collect monsters into your beastarium and summon companion pets!'
    },
    {
      id: 'tactician_mastery',
      title: language === 'ko' ? '전술가 마스터리' : 'Tactician Mastery',
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
      guide: language === 'ko' ? '전술 숙련도를 높여 황금/네온/보이드 배틀 아우라 스킨을 해금하고 능력치를 강화하세요.' : 'Level up tactician mastery to unlock golden and neon battle aura skins!'
    },
    {
      id: 'secret_stamps',
      title: language === 'ko' ? '비밀 업적 스탬프' : 'Secret Stamp Book',
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
      guide: language === 'ko' ? '전투와 게임 곳곳에 숨겨진 8종의 비밀 도전과제를 달성하고 스탬프 보상을 수령하세요.' : 'Uncover 8 hidden secret achievements and collect SNS stamp bounties!'
    },
    {
      id: 'gambit_tuning',
      title: language === 'ko' ? 'AI 갬빗 전술 지침' : 'Gambit Tactics',
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
      guide: language === 'ko' ? '자동 전투 AI의 3단계 조건부 갬빗 지침(HP/보스/약점)을 커스텀 튜닝하세요.' : 'Configure 3-slot conditional gambit tactics for smart auto-battles!'
    },
    {
      id: 'voxelbattlegrounds',
      title: language === 'ko' ? '블리츠 불릿 닷지' : 'Blitz Bullet Dodge',
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
      guide: language === 'ko' ? '화면을 손가락으로 드래그해 쏟아지는 탄막을 아슬아슬하게 피하고 더블 탭 패링 실드로 반사하세요.' : 'Drag to dodge bullet hell patterns and double tap to reflect bullets with Parry Shield!'
    },
    {
      id: 'pirate_roulette',
      title: language === 'ko' ? '황금 해적 룰렛' : 'Golden Pirate Roulette',
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
      guide: language === 'ko' ? '보스 완승 후 해적 통나무에 칼을 꽂아 폭발을 피해 누적 잭팟 상금을 획득하세요.' : 'Stab pirate barrels to accumulate massive jackpot SNS rewards!'
    },
    {
      id: 'golden_archery',
      title: language === 'ko' ? '황금 양궁 사격' : 'Golden Archery',
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
      guide: language === 'ko' ? '풍향과 풍속을 계산해 10점 만점 황금 과녁에 3발의 정밀 화살을 명중시키세요.' : 'Hit the golden 10-ring target with 3 precise wind-calculated arrows!'
    },
    {
      id: 'voxeldungeon',
      title: language === 'ko' ? '3D 복셀 던전 크롤러' : 'Voxel Dungeon Crawler',
      icon: Castle,
      color: 'from-indigo-600 to-purple-700',
      image: '/minigame_dungeon.png',
      characterId: 37,
      action: () => {
        setGameState('voxeldungeon');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D ROGUE',
      guide: language === 'ko' ? '절차적 3D 복셀 미궁에서 보물상자를 파밍하고 던전 보스를 토벌하는 3인칭 로그라이크 RPG입니다.' : 'Procedural 3D voxel dungeon crawler with loot chests and epic boss encounters!'
    },
    {
      id: 'voxelspace',
      title: language === 'ko' ? '3D 복셀 우주 오디세이' : 'Voxel Space Odyssey',
      icon: Compass,
      color: 'from-blue-600 to-cyan-500',
      image: '/minigame_shooting.png',
      characterId: 38,
      action: () => {
        setGameState('voxelspace');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SPACE',
      guide: language === 'ko' ? '우주 복셀 비행선을 조종하여 소행성을 회피/파괴하고 성간 웜홀을 돌파하는 스페이스 아케이드입니다.' : '3D voxel starship arcade flying through asteroid fields and cosmic wormholes!'
    },
    {
      id: 'voxelzombie',
      title: language === 'ko' ? '3D 복셀 좀비 서바이벌' : 'Voxel Zombie Survival',
      icon: Crosshair,
      color: 'from-emerald-700 to-green-900',
      image: '/minigame_breakout.png',
      characterId: 39,
      action: () => {
        setGameState('voxelzombie');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D ZOMBIE',
      guide: language === 'ko' ? '야간 복셀 도시에서 몰려오는 좀비 웨이브를 다양한 무기와 바리케이드로 막아내며 생존하세요.' : 'Survive endless voxel zombie hordes with weapons and barricades in the dark city!'
    },
    {
      id: 'voxelsiege',
      title: language === 'ko' ? '3D 복셀 중세 공성전' : 'Voxel Medieval Siege',
      icon: Castle,
      color: 'from-amber-700 to-stone-800',
      image: '/minigame_defense.png',
      characterId: 40,
      action: () => {
        setGameState('voxelsiege');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SIEGE',
      guide: language === 'ko' ? '투석기 궤적을 정밀 조준하여 적 성벽과 방어탑을 물리 파괴하고 아군 군대를 진격시키세요.' : 'Physics-based catapult siege destruction of enemy voxel castles and fortress towers!'
    },
    {
      id: 'voxeltitan',
      title: language === 'ko' ? '3D 복셀 타이탄 메카 레이드' : 'Voxel Titan Mecha Raid',
      icon: Swords,
      color: 'from-rose-600 to-red-800',
      image: '/minigame_boss.png',
      characterId: 41,
      action: () => {
        setGameState('voxeltitan');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D TITAN',
      guide: language === 'ko' ? '초대형 3D 복셀 타이탄 메카의 부위별 약점 코어를 공략하고 광폭화 필살기를 회피해 토벌하세요.' : 'Colossal 3D titan raid targeting vulnerable core parts while dodging berserk lasers!'
    },
    {
      id: 'voxeldeepsea',
      title: language === 'ko' ? '블리츠 딥씨 다이버' : 'Blitz Deep Sea Diver',
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
      guide: language === 'ko' ? '잠수함을 손가락으로 드래그하여 산소(🫧)와 크리스탈(💎)을 채굴하고 300m 심해에 도달하세요.' : 'Drag submarine to collect oxygen and crystals while diving toward 300m abyssal trench!'
    },
    {
      id: 'voxelacefighter',
      title: language === 'ko' ? '사이버 리듬 블래스터' : 'Cyber Rhythm Blaster',
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
      guide: language === 'ko' ? '4개 레인으로 떨어지는 네온 비트 노트를 타이밍에 맞춰 터치하고 콤보 피버를 폭발시키세요.' : 'Tap neon rhythm beat notes falling in 4 lanes to unleash high-combo fever!'
    },
    {
      id: 'voxeldriftmaster',
      title: language === 'ko' ? '3D 복셀 드리프트 마스터' : 'Voxel Drift Master',
      icon: Zap,
      color: 'from-fuchsia-600 to-indigo-700',
      image: '/minigame_slide2048.png',
      characterId: 44,
      action: () => {
        setGameState('voxeldriftmaster');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D DRIFT',
      guide: language === 'ko' ? '네온 사이버 도시 서킷에서 극한의 부스터와 코너링 드리프트로 최고 랩타임에 도전하세요.' : 'High-speed cyberpunk voxel racing with nitro boost and slick drifting mechanics!'
    },
    {
      id: 'voxelmonsterisle',
      title: language === 'ko' ? '3D 복셀 몬스터 아일' : 'Voxel Monster Isle',
      icon: Leaf,
      color: 'from-emerald-600 to-teal-700',
      image: '/minigame_memorymatch.png',
      characterId: 45,
      action: () => {
        setGameState('voxelmonsterisle');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D PETS',
      guide: language === 'ko' ? '목장에서 다양한 복셀 몬스터들을 먹이로 돌보고 훈련시켜 교배 및 진화시키세요.' : 'Feed, train, and breed diverse voxel companion pets in your ranch!'
    },
    {
      id: 'voxelcyberninja',
      title: language === 'ko' ? '블리츠 섀도우 듀얼' : 'Blitz Shadow Duel',
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
      guide: language === 'ko' ? '4방향에서 돌진해오는 그림자 적을 타이밍에 맞춰 해당 방향 탭으로 패링 반격하세요.' : 'Tap matching screen quadrants in time to parry incoming shadow attackers!'
    },
    {
      id: 'voxelraftsurvival',
      title: language === 'ko' ? '3D 복셀 뗏목 서바이벌' : 'Voxel Raft Survival',
      icon: Waves,
      color: 'from-blue-500 to-cyan-600',
      image: '/minigame_cardrush.png',
      characterId: 47,
      action: () => {
        setGameState('voxelraftsurvival');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D RAFT',
      guide: language === 'ko' ? '뗏목 위에서 부유 자원을 갈고리로 수집하고 상어의 습격을 막아내며 뗏목을 확장하세요.' : 'Hook floating ocean debris, fend off predators, and build a floating stronghold!'
    },
    {
      id: 'voxelsnowboard',
      title: language === 'ko' ? '3D 복셀 스노보드 익스트림' : 'Voxel Snowboard Extreme',
      icon: Mountain,
      color: 'from-sky-500 to-teal-600',
      image: '/minigame_cardjumper.png',
      characterId: 48,
      action: () => {
        setGameState('voxelsnowboard');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SNOW',
      guide: language === 'ko' ? '설산 슬로프를 고속 활강하며 점프대 묘기와 눈사태 회피로 최고 점수를 기록하세요.' : 'Extreme downhill snowboarding arcade with big air trick jumps and avalanche evasion!'
    },
    {
      id: 'voxelpinball',
      title: language === 'ko' ? '3D 복셀 핀볼 나이츠' : 'Voxel Pinball Knights',
      icon: Trophy,
      color: 'from-amber-600 to-yellow-600',
      image: '/minigame_cardslot.png',
      characterId: 49,
      action: () => {
        setGameState('voxelpinball');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D PINBALL',
      guide: language === 'ko' ? '중세 성채 핀볼 테이블에서 플리퍼를 조작해 범퍼 콤보와 보물 보너스를 터뜨리세요.' : 'Medieval fantasy 3D pinball machine with physics flippers and multiball combos!'
    },
    {
      id: 'voxelpirate',
      title: language === 'ko' ? '3D 복셀 해적 함대 함포전' : 'Voxel Pirate Battles',
      icon: Swords,
      color: 'from-amber-800 to-red-800',
      image: '/minigame_defense.png',
      characterId: 50,
      action: () => {
        setGameState('voxelpirate');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D CANNON',
      guide: language === 'ko' ? '해적선을 조종하여 풍향에 맞춰 측면 함포 일제사격으로 적 군함을 격침시키세요.' : 'Naval combat maneuvering warships and firing broadside voxel cannons!'
    },
    {
      id: 'voxelovercooked',
      title: language === 'ko' ? '3D 복셀 픽셀 오버쿡드' : 'Voxel Pixel Overcooked',
      icon: Flame,
      color: 'from-orange-500 to-amber-600',
      image: '/minigame_memorymatch.png',
      characterId: 51,
      action: () => {
        setGameState('voxelovercooked');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D COOK',
      guide: language === 'ko' ? '주방에서 재료 손질, 조리, 설거지, 서빙을 빠르게 처리하여 주문 러시를 클리어하세요.' : 'Chaotic kitchen cooking game preparing recipes under rapid order time limits!'
    },
    {
      id: 'voxelprophunt',
      title: language === 'ko' ? '3D 복셀 사물 프롭 헌트' : 'Voxel Prop Hunt',
      icon: Ghost,
      color: 'from-purple-600 to-indigo-800',
      image: '/minigame_cardflip.png',
      characterId: 52,
      action: () => {
        setGameState('voxelprophunt');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D HUNT',
      guide: language === 'ko' ? '가구나 상자로 변신해 숨거나 헌터가 되어 숨어있는 가짜 사물을 찾아내세요.' : 'Hide and seek game disguising as world props or hunting hidden players!'
    },
    {
      id: 'voxelquantum',
      title: language === 'ko' ? '3D 복셀 퀀텀 포탈' : 'Voxel Quantum Portal',
      icon: Sparkles,
      color: 'from-cyan-500 to-violet-600',
      image: '/minigame_cardsorcery.png',
      characterId: 53,
      action: () => {
        setGameState('voxelquantum');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D PORTAL',
      guide: language === 'ko' ? '블루/오렌지 포탈 건을 발사하여 물리 공간을 연결하고 큐브 퍼즐 챔버를 탈출하세요.' : 'First-person spatial puzzle shooter connecting portal gateways to escape rooms!'
    },
    {
      id: 'voxelrollinghero',
      title: language === 'ko' ? '3D 복셀 롤링 히어로' : 'Voxel Rolling Hero',
      icon: TargetIcon,
      color: 'from-lime-600 to-green-700',
      image: '/minigame_slide2048.png',
      characterId: 54,
      action: () => {
        setGameState('voxelrollinghero');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D ROLL',
      guide: language === 'ko' ? '기울어지는 공중 미로에서 구슬 히어로를 굴려 함정을 피하고 골인지점에 도달하세요.' : 'Gyroscope physics ball roller balancing on narrow sky paths to reach goals!'
    },
    {
      id: 'voxelsupersmash',
      title: language === 'ko' ? '3D 복셀 슈퍼 스매시 배틀' : 'Voxel Super Smash Battle',
      icon: Swords,
      color: 'from-red-600 to-rose-700',
      image: '/minigame_boss.png',
      characterId: 55,
      action: () => {
        setGameState('voxelsupersmash');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SMASH',
      guide: language === 'ko' ? '부유섬 배틀 아레나에서 강력한 넉백 공격과 아이템으로 적들을 장외로 날려버리세요.' : 'Platform arena brawler knocking opponents off the edge with smash attacks!'
    },
    {
      id: 'voxeltowercraft',
      title: language === 'ko' ? '3D 복셀 타워 크래프트' : 'Voxel Tower Craft',
      icon: Castle,
      color: 'from-stone-700 to-amber-800',
      image: '/minigame_defense.png',
      characterId: 56,
      action: () => {
        setGameState('voxeltowercraft');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D TOWER',
      guide: language === 'ko' ? '블록을 직접 쌓아 방어탑 요새를 건축하고 몰려오는 몬스터 웨이브를 저지하세요.' : 'Voxel building defense crafting tactical towers to repel monster waves!'
    },
    {
      id: 'voxelbeatblaster',
      title: language === 'ko' ? '아케인 체인 넘버' : 'Arcane Chain Number',
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
      guide: language === 'ko' ? '화면 위 숫자 노드를 손가락으로 드래그해 선으로 연결하여 목표 합계를 완성하세요.' : 'Drag to connect adjacent number nodes into chains matching the target sum!'
    },
    {
      id: 'voxelcastleblaster',
      title: language === 'ko' ? '블리츠 스카이 스택' : 'Blitz Sky Stack',
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
      guide: language === 'ko' ? '화면을 원터치 탭하여 움직이는 블록을 아래 타워에 맞춰 쌓고 20층을 정복하세요.' : 'Tap anywhere to stack moving blocks precisely onto the tower and reach floor 20!'
    },
    {
      id: 'voxelfactorycraft',
      title: language === 'ko' ? '3D 복셀 오토메이션 팩토리' : 'Voxel Factory Craft',
      icon: Sliders,
      color: 'from-teal-600 to-slate-800',
      image: '/minigame_cardslot.png',
      characterId: 59,
      action: () => {
        setGameState('voxelfactorycraft');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D FACTORY',
      guide: language === 'ko' ? '컨베이어 벨트, 분쇄기, 조립기를 설계하고 연결해 복셀 자동화 생산 라인을 완성하세요.' : 'Design conveyor belts, smelters, and assemblers to automate industrial production!'
    },
    {
      id: 'voxelsuperstrikers',
      title: language === 'ko' ? '3D 복셀 슈퍼 스트라이커즈' : 'Voxel Super Strikers',
      icon: Trophy,
      color: 'from-emerald-600 to-sky-700',
      image: '/minigame_breakout.png',
      characterId: 60,
      action: () => {
        setGameState('voxelsuperstrikers');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SOCCER',
      guide: language === 'ko' ? '로켓 부스터와 점프 헤더로 거대 축구공을 상대 골대에 강력하게 차 넣으세요.' : 'Rocket boost and jump header in 3D physics soccer arena!'
    },
    {
      id: 'voxelgladiatorcolosseum',
      title: language === 'ko' ? '3D 복셀 검투사 콜로세움' : 'Voxel Gladiator Arena',
      icon: Swords,
      color: 'from-amber-600 to-red-800',
      image: '/minigame_cardrush.png',
      characterId: 61,
      action: () => {
        setGameState('voxelgladiatorcolosseum');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D ARENA',
      guide: language === 'ko' ? '방패 패링과 타이밍 회피 후 강력한 필살 참격으로 콜로세움 챔피언을 굴복시키세요.' : 'Shield parry, evade, and execute slash combos in the roman colosseum arena!'
    },
    {
      id: 'voxeldragonslayer',
      title: language === 'ko' ? '3D 복셀 몬스터 헌터' : 'Voxel Dragon Slayer',
      icon: Flame,
      color: 'from-red-600 to-rose-900',
      image: '/minigame_boss.png',
      characterId: 62,
      action: () => {
        setGameState('voxeldragonslayer');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D DRAGON',
      guide: language === 'ko' ? '거대 화염 드래곤의 브레스와 꼬리치기를 피하며 약점 비늘을 부위 파괴하고 토벌하세요.' : 'Dodge fire breath and destroy weak points to slay the legendary voxel dragon!'
    },
    {
      id: 'voxelarcherhero',
      title: language === 'ko' ? '아케인 슬링샷 궁수' : 'Arcane Slingshot Archer',
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
      guide: language === 'ko' ? '화면의 활시위를 손가락으로 직접 당겨 각도를 조준하고 놓아서 몰려오는 몬스터들을 격추하세요.' : 'Drag and release the bowstring to aim and shoot flying monsters in physics archery!'
    },
    {
      id: 'voxelvampiresurvival',
      title: language === 'ko' ? '3D 복셀 뱀파이어 서바이벌' : 'Voxel Vampire Survival',
      icon: Skull,
      color: 'from-purple-600 to-indigo-950',
      image: '/minigame_cardsorcery.png',
      characterId: 64,
      action: () => {
        setGameState('voxelvampiresurvival');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SURVIVAL',
      guide: language === 'ko' ? '사방에서 몰려드는 수백 마리의 언데드 스웜을 회전 낫과 자동 탄막으로 휩쓸며 60초간 생존하세요.' : 'Survive the 60-second relentless undead swarm with auto-spinning scythes!'
    },
    {
      id: 'voxeltankbounce',
      title: language === 'ko' ? '3D 복셀 탱크 바운스 배틀' : 'Voxel Tank Bounce',
      icon: Crosshair,
      color: 'from-sky-600 to-blue-900',
      image: '/minigame_running.png',
      characterId: 65,
      action: () => {
        setGameState('voxeltankbounce');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D TANK',
      guide: language === 'ko' ? '벽면을 2회 튕겨 날아가는 도탄 포탄의 궤적을 계산해 엄폐 중인 적 전차를 저격 파괴하세요.' : 'Calculate 2-bounce ricochet ballistics to snipe hidden enemy tanks!'
    },
    {
      id: 'voxelninjaslash',
      title: language === 'ko' ? '3D 복셀 닌자 슬래시' : 'Voxel Ninja Slash',
      icon: Zap,
      color: 'from-pink-600 to-rose-950',
      image: '/minigame_cardslide.png',
      characterId: 66,
      action: () => {
        setGameState('voxelninjaslash');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D NINJA',
      guide: language === 'ko' ? '불릿타임 시간 감속 순간을 포착해 적 경비병들의 가드를 정밀 쾌속 발도술로 일도양단하세요.' : 'Slow time with bullet-time and execute rapid stealth katana slashes!'
    },
    {
      id: 'voxelgolfmaster',
      title: language === 'ko' ? '3D 복셀 골프 마스터' : 'Voxel Golf Master',
      icon: Wind,
      color: 'from-emerald-700 to-teal-900',
      image: '/minigame_pinball.png',
      characterId: 67,
      action: () => {
        setGameState('voxelgolfmaster');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D GOLF',
      guide: language === 'ko' ? '풍향과 경사면 바운스를 정밀 조준해 원거리 홀컵에 원샷 홀인원을 꽂아 넣으세요.' : 'Calculate wind velocity and fairway terrain bounce for the ultimate hole-in-one!'
    },
    {
      id: 'voxellumberjacktycoon',
      title: language === 'ko' ? '3D 복셀 벌목 서바이벌' : 'Voxel Lumberjack Tycoon',
      icon: Axe,
      color: 'from-amber-600 to-stone-800',
      image: '/minigame_towercraft.png',
      characterId: 68,
      action: () => {
        setGameState('voxellumberjacktycoon');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D TYCOON',
      guide: language === 'ko' ? '나무를 자동 벌목하고 통나무를 운반해 섬의 랜드마크 기지와 다리를 건설하세요.' : 'Chop voxel trees, transport logs, and build epic island bridges and cabins!'
    },
    {
      id: 'voxelfishingmaster',
      title: language === 'ko' ? '3D 복셀 낚시 타이쿤' : 'Voxel Fishing Master',
      icon: Fish,
      color: 'from-cyan-600 to-blue-900',
      image: '/minigame_cardflip.png',
      characterId: 69,
      action: () => {
        setGameState('voxelfishingmaster');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D FISHING',
      guide: language === 'ko' ? '입질 순간 즉각 챔질 후 장력 텐션을 세밀하게 컨트롤하며 심해 거대어를 낚아 올리세요.' : 'Hook upon bite and master reel tension to catch legendary sea monsters!'
    },
    {
      id: 'voxelfirerescue',
      title: language === 'ko' ? '3D 복셀 파이어 트럭 히어로' : 'Voxel Fire Rescue Hero',
      icon: Flame,
      color: 'from-red-600 to-amber-800',
      image: '/minigame_castleblaster.png',
      characterId: 70,
      action: () => {
        setGameState('voxelfirerescue');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D RESCUE',
      guide: language === 'ko' ? '초고압 소방 방수포로 화염 복셀을 진화하고 탈출 주민을 신속히 구조하세요.' : 'Extinguish blaze voxels with high-pressure water hose and rescue civilians!'
    },
    {
      id: 'voxelwindhunter',
      title: language === 'ko' ? '3D 복셀 양궁 마스터' : 'Voxel Archery Wind Hunter',
      icon: TargetIcon,
      color: 'from-emerald-600 to-teal-800',
      image: '/minigame_archerhero.png',
      characterId: 71,
      action: () => {
        setGameState('voxelwindhunter');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D ARCHERY',
      guide: language === 'ko' ? '거리별 낙차와 풍향 오프셋을 계산해 10점 만점 엑스텐(X-Ring)을 정조준하세요.' : 'Calculate ballistic drop and crosswind offset to hit the 10-point X-Ring!'
    },
    {
      id: 'voxelsubwayrunner',
      title: language === 'ko' ? '3D 복셀 서브웨이 러너' : 'Voxel Subway Runner',
      icon: Footprints,
      color: 'from-indigo-600 to-purple-800',
      image: '/minigame_parkour.png',
      characterId: 72,
      action: () => {
        setGameState('voxelsubwayrunner');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D RUNNER',
      guide: language === 'ko' ? '3차선 지하철 레일을 질주하며 롤링 슬라이드와 호버보드로 장애물을 돌파하세요.' : 'Sprint 3-lane subway tracks, slide roll under barriers and activate hoverboard!'
    },
    {
      id: 'voxelcranemaster',
      title: language === 'ko' ? '블리츠 택배 분류' : 'Blitz Express Sort',
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
      guide: language === 'ko' ? '중앙 택배 상자의 색상을 확인하고 해당 목적지 방향(상/하/좌/우)으로 빠르게 스와이프하세요.' : 'Check parcel colors and swipe quickly toward the matching depot direction (Up/Down/Left/Right)!'
    },
    {
      id: 'voxelmonstertruck',
      title: language === 'ko' ? '3D 복셀 몬스터 트럭 스매시' : 'Voxel Monster Truck Smash',
      icon: ShieldAlert,
      color: 'from-orange-600 to-red-900',
      image: '/minigame_tankbounce.png',
      characterId: 74,
      action: () => {
        setGameState('voxelmonstertruck');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SMASH',
      guide: language === 'ko' ? '초대형 66인치 몬스터 트럭으로 폐차 바리케이드를 짓밟고 니트로 점프를 작렬하세요.' : 'Crush scrap car ramps with massive 66-inch wheels and detonate nitro boost!'
    },
    {
      id: 'voxeltowerstack',
      title: language === 'ko' ? '3D 복셀 타워 스택 마스터' : 'Voxel Tower Stack Master',
      icon: Castle,
      color: 'from-purple-600 to-pink-800',
      image: '/minigame_towercraft.png',
      characterId: 75,
      action: () => {
        setGameState('voxeltowerstack');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D STACK',
      guide: language === 'ko' ? '좌우 슬라이딩 복셀 블록을 퍼펙트 타이밍에 정렬해 초고층 마천루를 건설하세요.' : 'Align oscillating 3D voxel slabs with perfect precision to build the sky tower!'
    },
    {
      id: 'voxelslamdunk',
      title: language === 'ko' ? '3D 복셀 점핑 배스킷볼' : 'Voxel Slam Dunk Basketball',
      icon: Flame,
      color: 'from-amber-600 to-orange-800',
      image: '/minigame_superstrikers.png',
      characterId: 76,
      action: () => {
        setGameState('voxelslamdunk');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D DUNK',
      guide: language === 'ko' ? '포물선 3점슛과 360도 윈드밀 슬램덩크로 온 파이어(On-Fire) 모드를 점화하세요.' : 'Launch 3-point parabolic shots and execute 360-degree windmill slam dunks!'
    },
    {
      id: 'voxelcoastertycoon',
      title: language === 'ko' ? '블리츠 카페 타이쿤' : 'Blitz Cafe Tycoon',
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
      guide: language === 'ko' ? '몰려오는 손님들의 주문 메뉴를 확인하고 하단 버튼을 탭해 빠르게 서빙하세요.' : 'Check customer order bubbles and tap the menu items below to serve them quickly!'
    },
    {
      id: 'voxelsniperhunter',
      title: language === 'ko' ? '3D 복셀 스나이퍼 헌터' : 'Voxel Sniper Hunter',
      icon: Crosshair,
      color: 'from-red-600 to-slate-900',
      image: '/minigame_pixelstrike.png',
      characterId: 78,
      action: () => {
        setGameState('voxelsniperhunter');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SNIPER',
      guide: language === 'ko' ? '망원 스코프 줌과 숨참기 손떨림 보정으로 표적을 시네마틱 헤드샷으로 암살하세요.' : 'Scope zoom, hold breath for 0% sway, and execute cinematic headshot assassinations!'
    },
    {
      id: 'voxeljetskiwater',
      title: language === 'ko' ? '3D 복셀 제트스키 워터 레이스' : 'Voxel Jetski Aqua Race',
      icon: Waves,
      color: 'from-cyan-600 to-blue-800',
      image: '/minigame_deepsea.png',
      characterId: 79,
      action: () => {
        setGameState('voxeljetskiwater');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D JETSKI',
      guide: language === 'ko' ? '수면 카빙 턴과 파도 점프 360도 에어 스핀 트릭, 하이드로 터보로 부표 코스를 질주하세요.' : 'Carve turns, leap over wave crests with 360° air spins, and blast hydro turbo!'
    },
    {
      id: 'voxelbaseballderby',
      title: language === 'ko' ? '블리츠 슬라이스 닌자' : 'Blitz Slice Ninja',
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
      guide: language === 'ko' ? '화면 위로 튀어오르는 과일과 보석을 손가락으로 직접 슥 베어 가르고 폭탄을 피하세요.' : 'Swipe across the screen to slice flying fruits and gems with your katana while avoiding bombs!'
    },
    {
      id: 'voxelboxingmighty',
      title: language === 'ko' ? '3D 복셀 마이티 복싱' : 'Voxel Mighty Boxing',
      icon: Swords,
      color: 'from-red-600 to-orange-700',
      image: '/minigame_boss.png',
      characterId: 81,
      action: () => {
        setGameState('voxelboxingmighty');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D BOXING',
      guide: language === 'ko' ? '잽, 어퍼컷, 가드 패링과 위빙 회피로 상대 복서의 빈틈을 파고들어 시원한 KO를 달성하세요.' : 'Dodge, parry with guard, and counter with devastating hooks and uppercuts!'
    },
    {
      id: 'voxelmicrokart',
      title: language === 'ko' ? '3D 복셀 마이크로 카트 레이싱' : 'Voxel Micro Kart Racing',
      icon: Zap,
      color: 'from-sky-500 to-indigo-600',
      image: '/minigame_drifting.png',
      characterId: 82,
      action: () => {
        setGameState('voxelmicrokart');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D KART',
      guide: language === 'ko' ? '미니 서킷에서 파워 슬라이드 드리프트와 터보 부스터, 바나나/미사일 아이템으로 1위를 차지하세요.' : 'Power-slide drift through hairpin turns and use tactical items to take the checkered flag!'
    },
    {
      id: 'voxeltreasuredigger',
      title: language === 'ko' ? '3D 복셀 트레저 디거' : 'Voxel Treasure Digger',
      icon: Pickaxe,
      color: 'from-amber-700 to-yellow-900',
      image: '/minigame_minesweeper.png',
      characterId: 83,
      action: () => {
        setGameState('voxeltreasuredigger');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D DIGGER',
      guide: language === 'ko' ? '지하 암반층을 곡괭이로 채굴하며 다이아몬드 광맥과 고대 유물을 발굴하고 산소 게이지를 관리하세요.' : 'Dig subterranean blocks, uncover rare gems and manage your oxygen supply!'
    },
    {
      id: 'voxelflightlanding',
      title: language === 'ko' ? '3D 복셀 플라이트 랜딩' : 'Voxel Flight Landing',
      icon: Compass,
      color: 'from-blue-600 to-cyan-700',
      image: '/minigame_shooting.png',
      characterId: 84,
      action: () => {
        setGameState('voxelflightlanding');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D FLIGHT',
      guide: language === 'ko' ? '강풍과 난기류를 극복하며 항공기의 피치와 활주로 진입 각도를 조절해 퍼펙트 소프트 랜딩을 성공시키세요.' : 'Manage throttle and descent pitch through crosswinds for a smooth runway touchdown!'
    },
    {
      id: 'voxelgachaclaw',
      title: language === 'ko' ? '3D 복셀 가챠 클로 머신' : 'Voxel Gacha Claw Machine',
      icon: Gift,
      color: 'from-pink-500 to-purple-600',
      image: '/minigame_cardslot.png',
      characterId: 85,
      action: () => {
        setGameState('voxelgachaclaw');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D CLAW',
      guide: language === 'ko' ? '크레인 클로를 3축 이동 및 하강시켜 레어 캡슐과 황금 복셀 인형을 집어 출구 드롭 존으로 운반하세요.' : 'Position the 3-axis mechanical claw and grab rare prize capsules into the drop chute!'
    },
    {
      id: 'voxelbilliardstrick',
      title: language === 'ko' ? '블리츠 트릭 포켓볼' : 'Blitz Trick Pocket',
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
      guide: language === 'ko' ? '흰색 수구를 손가락으로 당겨 각도와 파워를 조준하고 손을 떼어 포켓볼을 홀에 넣으세요.' : 'Pull back from the cue ball to aim and release to pocket all colored balls!'
    },
    {
      id: 'voxeldartsbar',
      title: language === 'ko' ? '블리츠 플릭 나이프' : 'Blitz Flick Knife',
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
      guide: language === 'ko' ? '화면을 원터치 탭하여 회전하는 통나무에 단검을 꽂아 넣고 사과를 베어내세요.' : 'Tap anywhere to throw knives into the spinning log target and slice apples!'
    },
    {
      id: 'voxelwingsuitskydiving',
      title: language === 'ko' ? '3D 복셀 윙슈트 스카이다이빙' : 'Voxel Wingsuit Skydiving Canyon',
      icon: Wind,
      color: 'from-sky-500 to-indigo-700',
      image: '/minigame_subway.png',
      characterId: 88,
      action: () => {
        setGameState('voxelwingsuitskydiving');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D WINGSUIT',
      guide: language === 'ko' ? '협곡을 따라 하강하며 링을 통과하고 에어로다이내믹 다이브 글라이딩으로 2000m 완벽 착륙을 달성하세요.' : 'Glide through canyon airspace, collect rings, and flare parachute for a perfect touchdown!'
    },
    {
      id: 'voxelbadmintonblitz',
      title: language === 'ko' ? '블리츠 핑퐁 랠리' : 'Blitz Ping Pong Rally',
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
      guide: language === 'ko' ? '화면을 좌우로 직접 드래그하여 탁구공을 받아치고 스매시를 날려 3점을 선취하세요.' : 'Drag across the screen directly to hit ping pong balls and unleash smashes to score 3 points!'
    },
    {
      id: 'voxelmagnethole',
      title: language === 'ko' ? '3D 복셀 서바이벌 마그넷 홀: 블랙홀 삼키기' : 'Voxel Magnet Hole: Blackhole Eater',
      icon: Gem,
      color: 'from-purple-600 to-pink-600',
      image: '/minigame_cardslot.png',
      characterId: 90,
      action: () => {
        setGameState('voxelmagnethole');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D HOLE',
      guide: language === 'ko' ? '블랙홀을 이동시켜 소형 오브젝트부터 삼켜 직경을 거대화하고 10m 자석 부스터로 도시를 흡입하세요.' : 'Move blackhole disk to swallow props, expand diameter, and trigger 10m vacuum booster!'
    },
    {
      id: 'voxelmotocrossstunt',
      title: language === 'ko' ? '3D 복셀 모터크로스 스턴트: 더트 바이크' : 'Voxel Motocross Stunt: Dirt Biker',
      icon: Flame,
      color: 'from-amber-500 to-orange-700',
      image: '/minigame_monstertruck.png',
      characterId: 91,
      action: () => {
        setGameState('voxelmotocrossstunt');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D MOTOCROSS',
      guide: language === 'ko' ? '오프로드 점프대에서 공중 360도 백플립 묘기와 퍼펙트 착지를 선보이며 2000m 트랙을 질주하세요.' : 'Hold gas across offroad hills, perform 360 backflips off ramps, and land perfectly!'
    },
    {
      id: 'voxelskateboardstreet',
      title: language === 'ko' ? '3D 복셀 스케이트보드 스트리트: 올리 킹' : 'Voxel Skateboard Street: Ollie King',
      icon: Sparkles,
      color: 'from-sky-500 to-blue-700',
      image: '/minigame_subway.png',
      characterId: 92,
      action: () => {
        setGameState('voxelskateboardstreet');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SKATE',
      guide: language === 'ko' ? '올리 점프로 레일에 올라타 50-50 그라인드 콤보와 공중 킥플립 360 트릭으로 최고 점수를 달성하세요.' : 'Ollie onto grind rails for high multipliers and perform 360 kickflips across street obstacles!'
    },
    {
      id: 'voxelsnowboardslalom',
      title: language === 'ko' ? '3D 복셀 스노보드 슬라롬: 알파인 슈레더' : 'Voxel Snowboard Slalom: Alpine Shredder',
      icon: Mountain,
      color: 'from-cyan-500 to-blue-600',
      image: '/minigame_jetski.png',
      characterId: 93,
      action: () => {
        setGameState('voxelsnowboardslalom');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SNOWBOARD',
      guide: language === 'ko' ? '설원을 카빙하며 레드와 블루 슬라롬 게이트를 통과하고 스노우 키커에서 에어 트릭을 성공시키세요.' : 'Carve alpine snow slopes through Red & Blue slalom gates and execute grab tricks off kickers!'
    },
    {
      id: 'voxelkaratebreak',
      title: language === 'ko' ? '3D 복셀 가라데 송판 & 석재 격파: 무도 마스터' : 'Voxel Karate Break: Martial Master',
      icon: Trophy,
      color: 'from-rose-600 to-amber-600',
      image: '/minigame_boss.png',
      characterId: 94,
      action: () => {
        setGameState('voxelkaratebreak');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D KARATE',
      guide: language === 'ko' ? '기력 게이지가 임계 영역에 도달했을 때 정권 찌르기를 날려 10단 송판과 화강암, 흑요석을 완전 격파하세요.' : 'Time your Ki focus and unleash powerful chops to shatter 10 stacked wood planks and obsidian blocks!'
    },
    {
      id: 'voxelpinballclimber',
      title: language === 'ko' ? '3D 복셀 핀볼 클라이머: 수직 타워 상승' : 'Voxel Pinball Climber: Tower Ascent',
      icon: Trophy,
      color: 'from-amber-500 to-rose-500',
      image: '/minigame_boss.png',
      characterId: 95,
      action: () => {
        setGameState('voxelpinballclimber');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D PINBALL',
      guide: language === 'ko' ? '듀얼 플리퍼로 복셀 핀볼을 상공으로 튕겨 올리며 범퍼와 보너스 링을 획득하고 수직 타워 정상을 정복하세요.' : 'Flip the voxel pinball with dual flippers, hit bumper targets, and climb the endless vertical tower!'
    },
    {
      id: 'voxelcrazytaxi',
      title: language === 'ko' ? '블리츠 하이웨이 레이서' : 'Blitz Highway Racer',
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
      guide: language === 'ko' ? '화면을 손가락으로 좌우 드래그하여 차선을 변경하고 장애물 차량을 아슬아슬하게 추월하세요.' : 'Drag finger across screen to steer lanes and near-miss traffic at high speed!'
    },
    {
      id: 'voxellaserstealth',
      title: language === 'ko' ? '3D 복셀 레이저 스텔스: 박물관 금고 잠입' : 'Voxel Laser Stealth: Vault Thief',
      icon: Trophy,
      color: 'from-rose-500 to-slate-800',
      image: '/minigame_boss.png',
      characterId: 97,
      action: () => {
        setGameState('voxellaserstealth');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D STEALTH',
      guide: language === 'ko' ? '이동하는 레이저 보안망을 슬라이딩으로 회피하고 EMP 스턴으로 무력화하며 금고의 다이아몬드를 탈취하세요.' : 'Slide under moving laser security grids, use EMP gadgets, and steal museum diamonds undetected!'
    },
    {
      id: 'voxeldojobalance',
      title: language === 'ko' ? '3D 복셀 도장 밸런스: 외나무다리 결투' : 'Voxel Dojo Balance: Log Duel',
      icon: Trophy,
      color: 'from-zinc-700 to-amber-600',
      image: '/minigame_boss.png',
      characterId: 98,
      action: () => {
        setGameState('voxeldojobalance');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D DOJO',
      guide: language === 'ko' ? '좁은 외나무다리 위에서 좌우 균형을 잡으며 봉술 타격과 가드 패링으로 상대 닌자를 낙하시키세요.' : 'Maintain balance on a narrow log high in the air and knock rival ninjas into the waterfall with staff strikes!'
    },
    {
      id: 'voxelbubblepop',
      title: language === 'ko' ? '블리츠 버블 버스트' : 'Blitz Bubble Burst',
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
      guide: language === 'ko' ? '화면 위 7x7 그리드에서 같은 색상 버블 뭉치를 직접 탭해 연쇄 폭발을 일으키세요.' : 'Tap matching color bubble clusters on the 7x7 grid to trigger cascading explosive bursts!'
    },
    {
      id: 'voxelwaterslide',
      title: language === 'ko' ? '3D 복셀 워터 슬라이드: 아쿠아 스플래시' : 'Voxel Water Slide: Aqua Splash',
      icon: Trophy,
      color: 'from-cyan-400 to-blue-600',
      image: '/minigame_boss.png',
      characterId: 100,
      action: () => {
        setGameState('voxelwaterslide');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D SLIDE',
      guide: language === 'ko' ? '워터파크 튜브를 타고 거대한 곡선 슬라이드 플룸을 초고속 카빙하며 황금 진주를 수집하고 스플래시 풀로 골인하세요.' : 'Ride inflatable tubes carving down giant water flumes at high speed into the splash pool!'
    },
    {
      id: 'voxelkrakenhunter',
      title: language === 'ko' ? '3D 복셀 심해 피싱: 크라켄 헌터' : 'Voxel Deepsea Fishing: Kraken Hunter',
      icon: Trophy,
      color: 'from-sky-600 to-rose-700',
      image: '/minigame_boss.png',
      characterId: 101,
      action: () => {
        setGameState('voxelkrakenhunter');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D KRAKEN',
      guide: language === 'ko' ? '어선을 타고 심해 소용돌이에 낚싯줄을 던져 줄 텐션을 조절하고 작살을 발사해 거대 크라켄을 포획하세요.' : 'Cast lines into deep ocean vortexes, manage tension to prevent snaps, and harpoon giant krakens!'
    },
    {
      id: 'voxelhalfpipeskater',
      title: language === 'ko' ? '3D 복셀 하프파이프 스케이터: 스트리트 트릭' : 'Voxel Halfpipe Skater: Street Tricks',
      icon: Trophy,
      color: 'from-amber-500 to-cyan-500',
      image: '/minigame_boss.png',
      characterId: 102,
      action: () => {
        setGameState('voxelhalfpipeskater');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D HALFPIPE',
      guide: language === 'ko' ? 'U자형 하프파이프 램프에서 펌핑 가속 후 공중으로 도약하여 킥플립, 스핀, 핸드플랜트 묘기를 완성하세요.' : 'Pump speed in the U-ramp, launch high into the air, and pull off 360 spins and flip tricks!'
    },
    {
      id: 'voxelnetherportal',
      title: language === 'ko' ? '3D 복셀 네더 포탈: 차원 균열 점프' : 'Voxel Nether Portal: Dimension Jump',
      icon: Trophy,
      color: 'from-purple-900 to-orange-700',
      image: '/minigame_boss.png',
      characterId: 103,
      action: () => {
        setGameState('voxelnetherportal');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D PORTAL',
      guide: language === 'ko' ? '네더 용암 바다 위 부유 섬들을 점프하며 네더 오브를 수집하고 차원 균열을 피해 탈출 포탈을 여세요.' : 'Leap across floating nether islands above lava, collect purple orbs, and escape through the dimensional portal!'
    },
    {
      id: 'voxelmegaflareassault',
      title: language === 'ko' ? '3D 복셀 메가 플레어: 공중 함대 요격전' : 'Voxel Mega Flare: Sky Assault',
      icon: Trophy,
      color: 'from-amber-600 to-red-800',
      image: '/minigame_boss.png',
      characterId: 104,
      action: () => {
        setGameState('voxelmegaflareassault');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D MEGAFLARE',
      guide: language === 'ko' ? '바하무트의 브레스를 조준 발사하여 적 공중 요새 함선들을 요격하고 게이지를 채워 메가 플레어를 폭발시키세요.' : 'Aim Bahamut breath shots to intercept enemy voxel airships and charge the gauge to unleash Mega Flare!'
    },
    {
      id: 'voxelspikerolling',
      title: language === 'ko' ? '3D 복셀 스파이크 롤러: 볼더 크러시' : 'Voxel Spike Roller: Boulder Crush',
      icon: Trophy,
      color: 'from-orange-700 to-yellow-600',
      image: '/minigame_boss.png',
      characterId: 105,
      action: () => {
        setGameState('voxelspikerolling');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D ROLLER',
      guide: language === 'ko' ? '회전하는 가시 볼더가 되어 협곡 내리막 트랙을 질주하며 크리스탈 블록과 바위를 부수고 전방위 분쇄 콤보를 달성하세요.' : 'Roll down steep canyon slopes as a giant spike boulder, crushing rocks and crystals for massive combo points!'
    },
    {
      id: 'voxelterraquake',
      title: language === 'ko' ? '3D 복셀 테라 퀘이크: 지반 붕괴 서바이벌' : 'Voxel Terra Quake: Ground Survival',
      icon: Trophy,
      color: 'from-lime-800 to-emerald-900',
      image: '/minigame_boss.png',
      characterId: 106,
      action: () => {
        setGameState('voxelterraquake');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D QUAKE',
      guide: language === 'ko' ? '무너지는 3D 지반 타일 위에서 지진 충격파를 발동해 암석을 분쇄하고 대지의 고대 보석을 채굴하며 생존하세요.' : 'Survive on shaking collapsible ground tiles, trigger earth shockwaves, and mine ancient gems!'
    },
    {
      id: 'voxeldreamweaver',
      title: language === 'ko' ? '3D 복셀 드림위버: 에메랄드 링 플라이트' : 'Voxel Dreamweaver: Emerald Flight',
      icon: Trophy,
      color: 'from-emerald-600 to-teal-800',
      image: '/minigame_boss.png',
      characterId: 107,
      action: () => {
        setGameState('voxeldreamweaver');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D DREAM',
      guide: language === 'ko' ? '에메랄드 꿈의 세계를 3D 비행하며 회전하는 빛의 링을 연속 통과하여 비행 부스터를 유지하고 악몽 안개를 정화하세요.' : 'Glide through emerald dreamscapes, pass through rotating light rings in sequence, and clear nightmare mists!'
    },
    {
      id: 'voxellifeflame',
      title: language === 'ko' ? '3D 복셀 라이프 플레임: 생명의 나무 디펜스' : 'Voxel Life Flame: Tree Defense',
      icon: Trophy,
      color: 'from-rose-600 to-pink-900',
      image: '/minigame_boss.png',
      characterId: 108,
      action: () => {
        setGameState('voxellifeflame');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D LIFE',
      guide: language === 'ko' ? '360도 붉은 생명의 불꽃을 회전 조준 발사하여 몰려오는 섀도우 괴물들을 정화하고 신성한 세계수를 수호하세요.' : 'Fire 360-degree life flame projectiles to purify approaching shadow creeps and defend the sacred World Tree!'
    },
    {
      id: 'voxelarcanenexus',
      title: language === 'ko' ? '아케인 젬 크러시' : 'Arcane Gem Crush',
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
      guide: language === 'ko' ? '인접한 원소 보석을 스와이프/탭하여 3개 이상 일렬로 매칭하고 연쇄 폭발 콤보를 터뜨리세요.' : 'Swap adjacent element gems to match 3+ in a row and trigger massive cascade combos!'
    },
    {
      id: 'voxeldreadshadow',
      title: language === 'ko' ? '3D 복셀 드레드 섀도우: 암흑 잠입 침투' : 'Voxel Dread Shadow: Stealth Mission',
      icon: Trophy,
      color: 'from-slate-900 to-purple-950',
      image: '/minigame_boss.png',
      characterId: 110,
      action: () => {
        setGameState('voxeldreadshadow');
      },
      category: '3d',
      isNew: true,
      badgeText: '3D STEALTH',
      guide: language === 'ko' ? '섀도우 은신 모드를 켜고 감시탑의 서치라이트를 피해 적 요새 심장부로 침투하여 암흑 코어를 해킹하세요.' : 'Activate shadow cloak to bypass searchlights, infiltrate deep into the enemy fortress, and hack the dark core!'
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
      // 1. 스네이크/슈팅 모드
      if (['snake', 'shooting'].includes(gameState)) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('modeSelect');
        return;
      }

      // 1.6. 오목/2048/메모리매치 모드
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

      // 2. 디펜스 모드
      if (gameState === 'defense') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        window.dispatchEvent(new CustomEvent('defense-exit-request'));
        return;
      }

      // 3. 운동 모드
      if (gameState === 'running') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setConfirmModal({
          isOpen: true,
          title: language === 'ko' ? '경고' : 'WARNING',
          message: language === 'ko'
            ? '운동을 중단하고 나가시겠습니까? 획득한 보상이 증발할 수 있습니다. 중지 버튼을 누르면 기록이 안전하게 저장됩니다.'
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

      // 4. 던전 배틀 모드
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

      // 4. 던전 맵 모드
      if (isDungeonActive) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setIsDungeonActive(false);
        saveDungeonState(false);
        setGameState('modeSelect');
        return;
      }

      // 5. 보스 모드 대기실
      if (isBossActive) {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setIsBossActive(false);
        saveBossState(false);
        setGameState('modeSelect');
        return;
      }



      // 7. 스토리 모드 진행
      if (gameState === 'story') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setIsStoryActive(false);
        saveStoryProgress(storyAct, storyStep, false);
        setGameState('modeSelect');
        return;
      }

      // 7. 프리매치 (매칭 설정 대기 화면)
      if (gameState === 'preMatch') {
        e.preventDefault();
        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        setGameState('lobby');
        return;
      }

      // 8. 매칭 검색 중 또는 코인 플립 중
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

      // 9. 카드 대전 진행 중 (또는 결과 화면)
      if (gameState === 'playing') {
        e.preventDefault();
        if (!gameOver) {
          setShowForfeitConfirm(true);
        } else {
          handleExitMatch(false);
        }
        return;
      }

      // 10. 로비 모드 (3x3 맵 대기실)
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
            <span>GPS 신호 수신 실패 또는 권한이 거부되었습니다. 기기의 위치설정을 활성화해주세요.</span>
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
              <span className="text-base">🎁</span>
              <span>{language === 'ko' ? '남은 보물' : 'Chests'}: <span className="text-amber-400 font-extrabold">{treasureChests.filter(c => !c.isOpened).length} / 5</span></span>
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
                  🎉 CARD DISCOVERED! (10m)
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
                  🎁 {t('mode_treasure', language)} - {language === 'ko' ? '보물 획득!' : 'TREASURE DISCOVERED!'}
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
                    ? (language === 'ko' ? '실시간 보물찾기 데이터가 본인의 SNS 계정과 성공적으로 동기화되었습니다.' : 'Real-time treasure hunt data has been successfully synchronized with your SNS account.')
                    : (language === 'ko' ? '실시간 운동 데이터가 본인의 SNS 계정과 성공적으로 동기화되었습니다.' : 'Real-time workout data has been successfully synchronized with your SNS account.')}
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
                    <span className="text-yellow-400 font-black">🎉 획득한 카드: {runningEarnedCards.length}장!</span>
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
                      // 부지런의 나무 쿨타임 확인 (10시간)
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
                          ? `🎁 보물 대전 완주 기록! 총 ${runningDistance.toFixed(1)}m 이동하며 보물상자 ${treasureChests.filter(c => c.isOpened).length}개를 획득하고 +${runningEarnedSns} SNS 포인트를 동기화했습니다!${claimedTreeReward ? ' (부지런의 나무 보상 1,000 SNS 추가 획득)' : ''}`
                          : `🏃‍♂️ 러닝 대전 완주 기록! 총 ${runningDistance.toFixed(1)}m 이동하며 ${runningCalories.toFixed(1)}kcal를 소모하고 +${runningEarnedSns} SNS 포인트를 동기화했습니다!${claimedTreeReward ? ' (부지런의 나무 보상 1,000 SNS 추가 획득)' : ''}`;

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
                          title: language === 'ko' ? '공유 성공' : 'SHARE SUCCESS',
                          message: claimedTreeReward 
                            ? (language === 'ko' ? '커뮤니티 공유 성공! (부지런의 나무 보상 1,000 SNS 추가 획득)' : 'Shared successfully! (+1,000 SNS Diligence Tree Reward)')
                            : (language === 'ko' ? '커뮤니티 공유 성공!' : 'Shared to community successfully!'),
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

                        let errorMsg = (language === 'ko' ? '공유 중 오류가 발생했습니다: ' : 'Error sharing post: ') + (err?.message || err);
                        if (err && err.code === 'permission-denied') {
                          errorMsg = language === 'ko' 
                            ? '로그인 세션이 만료되었거나 비회원 상태이므로 클라우드 공유는 생략하고 로컬에 저장되었습니다.' 
                            : 'Cloud sharing skipped and saved locally as guest/permission denied.';
                        }
                        
                        setConfirmModal({
                          isOpen: true,
                          title: language === 'ko' ? '알림' : 'NOTIFICATION',
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
                    {language === 'ko' ? '취소' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black uppercase italic text-sm tracking-wider rounded-xl shadow-[0_5px_15px_rgba(220,38,38,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {language === 'ko' ? '확인' : 'Confirm'}
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
                {dungeonBattleIsBoss ? "BOSS SHOWDOWN (보스 대전)" : "FIELD HUNTING (일반 사냥)"}
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
                        {dungeonBattleWinner === 'player' ? "VICTORY! (승리)" : "DEFEAT (패배)"}
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
                      {dungeonBattleWinner === 'player' ? "필드 전투 승리!" : "전투에서 패배했습니다."}
                    </h3>

                    {dungeonBattleWinner === 'ai' && dungeonDefeatCountdown !== null && (
                      <div className="text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-3 py-1.5 rounded-xl animate-pulse inline-block">
                        {language === 'ko' ? `${dungeonDefeatCountdown}초 후 자동으로 닫힙니다...` : `Auto closing in ${dungeonDefeatCountdown}s...`}
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
                        ? (language === 'ko' ? `확인 (${dungeonDefeatCountdown}초)` : `Confirm (${dungeonDefeatCountdown}s)`)
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
              <span className="text-xs text-yellow-400 font-black">🪙 {sns?.toLocaleString()}</span>
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
                    🏃 {language === 'ko' ? "10m를 걸어 다닐 때마다\n가장 가까운 AI와 자동으로 던전 대전이 시작됩니다!" : "Walk 10m to auto-trigger\ndungeon battle with the nearest AI!"}
                  </div>
                </div>
              </div>

              {/* Map Interaction Hint */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-955/90 backdrop-blur-md text-white px-4 py-2.5 text-[10px] font-semibold rounded-full shadow-lg pointer-events-none tracking-tight uppercase whitespace-nowrap border border-white/5 font-sans">
                📍 {language === 'ko' ? "지도의 빨간 마커를 탭하면 던전 대전을 시작할 수 있습니다." : "TAP RED MARKERS TO ENGAGE DUNGEON BATTLE"}
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
                👾 {language === 'ko' ? "AI 로봇을 탭하면 진짜 던전 대전 필드로 입장합니다." : "TAP AI ROBOT TO ENTER THE TRUE DUNGEON"}
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
        <div className="absolute top-5 left-[15%] text-4xl opacity-60 animate-pulse">🛰️</div>
        <div className="absolute top-8 right-[25%] text-5xl opacity-50 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🚀</div>
        <div className="absolute top-12 left-[40%] text-2xl opacity-40">🌌</div>
        <div className="absolute top-6 right-[10%] text-3xl opacity-50 animate-bounce-slow">🛰️</div>

        {/* Dense Futuristic City Buildings */}
        <div className="absolute top-1/4 left-10 text-7xl opacity-60 select-none pointer-events-none drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">🏙️</div>
        <div className="absolute top-1/4 left-32 text-6xl opacity-40 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]">🏢</div>
        <div className="absolute top-[30%] right-[15%] text-7xl opacity-50 select-none pointer-events-none drop-shadow-[0_0_20px_rgba(255,0,255,0.8)]">🗼</div>

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
            <span className="text-xs text-yellow-400 font-black">🪙 {sns?.toLocaleString()}</span>
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
              {language === 'ko' ? "지도의 AI 몬스터를 선택하여 필드 전투를 시작하세요! 보스 동굴을 클릭하면 보스 대전이 시작됩니다." : "Select an AI monster on the map to start a field battle! Tap boss caves to start a boss showdown."}
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
                  COOLDOWN (휴식 중)
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
              {isCooldown ? "WAITING..." : "CHALLENGE (대결하기)"}
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
            <span className="text-xs text-yellow-400 font-black">🪙 {sns?.toLocaleString()}</span>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-start max-w-5xl mx-auto w-full gap-6 touch-auto z-10">
          <div className="w-full text-center max-w-xl">
            <p className="text-xs md:text-sm font-medium text-slate-350 leading-relaxed bg-slate-900/80 backdrop-blur-md px-4 py-3.5 border border-white/10 rounded-2xl shadow-lg">
              {language === 'ko' 
                ? "스토리 대전에서 처치했던 보스들과 1대1 카드 대전을 펼칩니다. 각 보스는 10시간에 1회만 처치할 수 있으나, 확실한 대량 보상을 획득할 수 있습니다!" 
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
            // 1, 2막 Akira 카드 (id 64)
            const akiraCardData: CardData = {
              id: 'story-akira',
              title: CARD_DATABASE[64]?.title || '엘프군주',
              title_en: CARD_DATABASE[64]?.title_en || 'Elf Lord',
              title_dis: CARD_DATABASE[64]?.title_dis || 'Elf Lord',
              stats: [...(CARD_DATABASE[64]?.stats || [7, 2, 3, 5])] as [number, number, number, number],
              rarity: CARD_DATABASE[64]?.rarity || 'bronze',
              level: 1,
              imageIndex: 64,
              owner: null
            };

            // 3, 4막 Charsi 카드 (id 79)
            const charsiCardData: CardData = {
              id: 'story-charsi',
              title: CARD_DATABASE[79]?.title || '스트로베리',
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
                      {t('story_act_prefix', language).replace('{act}', String(storyAct + 1))} {language === 'ko' ? "클리어!" : "Cleared!"}
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
                          {storyAct === 0 || storyAct === 1 ? (language === 'ko' ? "추가 보상" : "BONUS") : (language === 'ko' ? "획득 아이템" : "ITEM")}
                        </span>
                        {storyAct === 0 || storyAct === 1 ? (
                          <span className="text-sm font-black italic text-purple-400">
                            +1 {language === 'ko' ? "스킬포인트" : "Skill Point"}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="text-base text-purple-400 leading-none">
                              {storyBonusItem?.emoji || '🛡️'}
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
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">웅장한 서사의 마무리</h3>
                    <p className="text-xs font-bold text-slate-350 leading-relaxed font-sans px-2 pt-2">
                      {language === 'ko' 
                        ? '천상계와의 위대한 결전 끝에 인류와 모든 피조물들은 마침내 평화를 맞이했습니다. 이제 그들을 초월한 새로운 시대가 시작됩니다. 영웅이여, 수고하셨습니다!'
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
                title: language === 'ko' ? '토너먼트 포기' : 'FORFEIT TOURNAMENT',
                message: language === 'ko' ? '정말 진행 중인 토너먼트를 포기하시겠습니까?' : 'Do you really want to forfeit this tournament?',
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
                  🚀 {language === 'ko' ? "다음 라운드 진출!" : "ADVANCED!"}
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
                    {language === 'ko' ? '취소' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase text-xs tracking-wider rounded-xl shadow-md transition-all cursor-pointer text-center"
                  >
                    {language === 'ko' ? '확인' : 'Confirm'}
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
        onReward={(amount) => handleMinigameReward(amount, '슈팅대전 보상', 'Shooting Battle reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '스네이크대전 보상', 'Snake Battle reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '오목 보상', 'Gomoku reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드 짝맞추기 보상', 'Memory Match reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '2048 보상', '2048 reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드점프 보상', 'Card Jumper reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드탭 보상', 'Card Tap reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드플립 보상', 'Card Flip reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드슬라이드 보상', 'Card Slide reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드소서리 보상', 'Card Sorcery reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드슬롯 보상', 'Card Slot reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드 하이스트 보상', 'Card Heist reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '카드 러시 보상', 'Card Rush reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '벽돌깨기 보상', 'Breakout reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '지뢰찾기 보상', 'Minesweeper reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '팩맨 보상', 'Pacman reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '틱택토 보상', 'Tic-Tac-Toe reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '티렉스 러너 보상', 'T-Rex Runner reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '복셀 디펜스 보상', 'Voxel Defense reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '픽셀 스트라이크 보상', 'Pixel Strike reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '스카이 파쿠르 보상', 'Sky Parkour reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 불릿 닷지 보상', 'Blitz Bullet Dodge reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '던전 크롤러 보상', 'Dungeon Crawler reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '우주 오디세이 보상', 'Space Odyssey reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '좀비 서바이벌 보상', 'Zombie Survival reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '중세 공성전 보상', 'Medieval Siege reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '타이탄 메카 보상', 'Titan Mecha reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 딥씨 다이버 보상', 'Blitz Deep Sea Diver reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '사이버 리듬 블래스터 보상', 'Cyber Rhythm Blaster reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '드리프트 마스터 보상', 'Drift Master reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '몬스터 아일 보상', 'Monster Isle reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 섀도우 듀얼 보상', 'Blitz Shadow Duel reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '뗏목 서바이벌 보상', 'Raft Survival reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '스노보드 익스트림 보상', 'Snowboard Extreme reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '핀볼 나이츠 보상', 'Pinball Knights reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '해적 함대 보상', 'Pirate Battles reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '픽셀 오버쿡드 보상', 'Pixel Overcooked reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '사물 프롭 헌트 보상', 'Prop Hunt reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '퀀텀 포탈 보상', 'Quantum Portal reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '롤링 히어로 보상', 'Rolling Hero reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '슈퍼 스매시 보상', 'Super Smash reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '타워 크래프트 보상', 'Tower Craft reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '아케인 체인 넘버 보상', 'Arcane Chain Number reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 스카이 스택 보상', 'Blitz Sky Stack reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '오토메이션 팩토리 보상', 'Factory Craft reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '슈퍼 스트라이커즈 보상', 'Super Strikers reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '검투사 콜로세움 보상', 'Gladiator Colosseum reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '드래곤 슬레이어 보상', 'Dragon Slayer reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '아케인 슬링샷 궁수 보상', 'Arcane Slingshot Archer reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '뱀파이어 서바이벌 보상', 'Vampire Survival reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '탱크 바운스 보상', 'Tank Bounce reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '닌자 슬래시 보상', 'Ninja Slash reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '골프 마스터 보상', 'Golf Master reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '벌목 서바이벌 보상', 'Lumberjack Tycoon reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '낚시 타이쿤 보상', 'Fishing Master reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '소방차 히어로 보상', 'Fire Rescue Hero reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '양궁 마스터 보상', 'Archery Wind Hunter reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '서브웨이 러너 보상', 'Subway Runner reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 택배 분류 보상', 'Blitz Express Sort reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '몬스터 트럭 보상', 'Monster Truck Smash reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '타워 스택 보상', 'Tower Stack Master reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '배스킷볼 슬램덩크 보상', 'Slam Dunk Basketball reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 카페 타이쿤 보상', 'Blitz Cafe Tycoon reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '스나이퍼 헌터 보상', 'Sniper Hunter reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '제트스키 워터 레이스 보상', 'Jetski Aqua Race reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 슬라이스 닌자 보상', 'Blitz Slice Ninja reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '마이티 복싱 보상', 'Mighty Boxing reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '마이크로 카트 레이싱 보상', 'Micro Kart Racing reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '트레저 디거 보상', 'Treasure Digger reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '플라이트 랜딩 보상', 'Flight Landing reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '가챠 클로 머신 보상', 'Gacha Claw reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 트릭 포켓볼 보상', 'Blitz Trick Pocket reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 플릭 나이프 보상', 'Blitz Flick Knife reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '윙슈트 스카이다이빙 보상', 'Wingsuit Skydiving reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 핑퐁 랠리 보상', 'Blitz Ping Pong Rally reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '마그넷 홀 보상', 'Magnet Hole reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '모터크로스 스턴트 보상', 'Motocross Stunt reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '스케이트보드 스트리트 보상', 'Skateboard Street reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '스노보드 슬라롬 보상', 'Snowboard Slalom reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '가라데 격파 보상', 'Karate Break reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '핀볼 클라이머 보상', 'Pinball Climber reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 하이웨이 레이서 보상', 'Blitz Highway Racer reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '레이저 스텔스 보상', 'Laser Stealth reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '도장 밸런스 보상', 'Dojo Balance reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '블리츠 버블 버스트 보상', 'Blitz Bubble Burst reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '워터 슬라이드 보상', 'Water Slide reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '크라켄 헌터 보상', 'Kraken Hunter reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '하프파이프 스케이터 보상', 'Halfpipe Skater reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '네더 포탈 보상', 'Nether Portal reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '메가 플레어 요격전 보상', 'Mega Flare Sky Assault reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '스파이크 롤러 보상', 'Spike Roller reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '테라 퀘이크 보상', 'Terra Quake reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '드림위버 비행 보상', 'Dreamweaver Flight reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '라이프 플레임 보상', 'Life Flame Defense reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '아케인 젬 크러시 보상', 'Arcane Gem Crush reward')}
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
        onReward={(amount) => handleMinigameReward(amount, '드레드 섀도우 보상', 'Dread Shadow Stealth reward')}
      />
    );
  }

  if (gameState === 'modeSelect') {
    // 오늘의 미션 게임 ID 생성 (날짜 기반 해시로 매일 교체)
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
      return shuffled.slice(0, 4); // 오늘의 미션 4개
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
              aria-label={language === 'ko' ? '도움말' : 'Help'}
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
                  🎴
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
                      ? `총 ${modes.length}종의 미션 게임 × No.01~${String(modes.length).padStart(2, '0')} 히어로 카드 전담 매칭` 
                      : `Total ${modes.length} Mission Games × No.01~${String(modes.length).padStart(2, '0')} Hero Card System`}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-sm shrink-0 self-start sm:self-auto">
                <span className="text-[11px] text-slate-400">{language === 'ko' ? '카드 연동률' : 'Card Linked'}</span>
                <span className="text-xs font-black text-emerald-400 font-mono">100% ({modes.length}/{modes.length})</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed border-t border-slate-800/80 pt-2">
              {language === 'ko'
                ? `모든 미션 게임은 1번 카드(No.01 ${CARD_DATABASE[1]?.title || '아쿠아리스'})부터 순서대로 고유 히어로 캐릭터 카드가 담당 수호자로 배속되어 있습니다.`
                : `Every mission game is assigned a unique Hero Card starting from No.01 (${CARD_DATABASE[1]?.title_en || 'Aquaris'}) as guardian.`}
            </p>
          </div>

          {/* Mode Search & Category Filter Tabs */}
          <div className="flex flex-col gap-2.5 w-full pt-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono flex-1">
                {[
                  { id: 'all', labelKo: `전체 (${modes.length})`, labelEn: `All (${modes.length})` },
                  { id: '3d', labelKo: `3D 복셀 (${modes.filter(m => m.category === '3d').length})`, labelEn: `3D Voxel (${modes.filter(m => m.category === '3d').length})` },
                  { id: 'battle', labelKo: `배틀 (${modes.filter(m => m.category === 'battle').length})`, labelEn: `Battle (${modes.filter(m => m.category === 'battle').length})` },
                  { id: 'arcade', labelKo: `아케이드 (${modes.filter(m => m.category === 'arcade').length})`, labelEn: `Arcade (${modes.filter(m => m.category === 'arcade').length})` },
                  { id: 'puzzle', labelKo: `퍼즐 (${modes.filter(m => m.category === 'puzzle').length})`, labelEn: `Puzzle (${modes.filter(m => m.category === 'puzzle').length})` },
                  { id: 'casual', labelKo: `캐주얼 (${modes.filter(m => m.category === 'casual').length})`, labelEn: `Casual (${modes.filter(m => m.category === 'casual').length})` }
                ].map(cat => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setSelectedCategory(cat.id as any);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-sm whitespace-nowrap font-bold transition-all cursor-pointer border text-xs min-h-[36px] flex items-center justify-center",
                        active
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {language === 'ko' ? cat.labelKo : cat.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick search */}
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ko' ? '게임 모드 또는 히어로 이름 검색...' : 'Search game modes or hero names...'}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-sm text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Mode List Grid - Card Battle Theme Frame Style (3 cards per row) */}
          <main className="flex-1 px-0 pb-4 md:pb-8 pt-0 flex flex-col justify-start items-center w-full gap-3 md:gap-5 overflow-y-visible">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full py-3 sm:py-4 items-stretch font-mono">
              {filteredModes.map((m, idx) => {
                const IconComp = m.icon;
                const cardIndex = m.characterId || (idx + 1);
                const charCard = CARD_DATABASE[cardIndex] || CARD_DATABASE[((cardIndex - 1) % 110) + 1];
                const charName = charCard ? (language === 'ko' ? charCard.title : charCard.title_en) : m.title;
                const cardNumFormatted = String(cardIndex).padStart(2, '0');
                
                // Element visual config
                const elem = (charCard?.element || 'neutral') as string;
                const elemBadgeStyle = 
                  elem === 'water' ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60' :
                  elem === 'fire' ? 'bg-rose-950/80 text-rose-300 border-rose-700/60' :
                  elem === 'air' || elem === 'wind' ? 'bg-sky-950/80 text-sky-300 border-sky-700/60' :
                  elem === 'earth' || elem === 'land' ? 'bg-amber-950/80 text-amber-300 border-amber-700/60' :
                  elem === 'dragon' || elem === 'holy' ? 'bg-yellow-950/80 text-yellow-300 border-yellow-600/60' :
                  elem === 'undead' || elem === 'monster' ? 'bg-purple-950/80 text-purple-300 border-purple-700/60' :
                  'bg-slate-900 text-slate-300 border-slate-700';
                  
                const elemIcon = 
                  elem === 'water' ? '💧' :
                  elem === 'fire' ? '🔥' :
                  elem === 'air' || elem === 'wind' ? '🌪️' :
                  elem === 'earth' || elem === 'land' ? '⛰️' :
                  elem === 'dragon' || elem === 'holy' ? '✦' :
                  elem === 'undead' || elem === 'monster' ? '💀' : '⚔️';

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                    whileHover={lowSpecMode ? {} : { y: -3, transition: { duration: 0.15 } }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        recordModePlay(m.id);
                        m.action();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          recordModePlay(m.id);
                          m.action();
                        }
                      }}
                      className="w-full min-h-[180px] sm:min-h-[220px] bg-[#14121e] border border-slate-800 rounded-sm hover:border-amber-400/80 hover:shadow-md transition-all flex flex-col overflow-hidden group cursor-pointer text-left"
                      aria-label={`${m.title} - No.${cardNumFormatted} ${charName}`}
                    >
                      {/* TCG Card Header Bar */}
                      <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-slate-950/90 border-b border-slate-800/90 flex items-center justify-between gap-1 text-[9px] sm:text-[10px] text-white">
                        <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                          <span className="font-black text-amber-400 bg-amber-400/10 border border-amber-400/25 px-1 py-0.2 rounded-xs tracking-tight shrink-0 text-[8px] sm:text-[9px]">
                            No.{cardNumFormatted}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 font-semibold truncate">
                            {charName}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                          <span className={cn("text-[8px] sm:text-[9px] px-1 py-0.2 rounded-xs border font-black flex items-center gap-0.5", elemBadgeStyle)}>
                            <span>{elemIcon}</span>
                            <span className="uppercase text-[7px] sm:text-[8px] hidden min-[400px]:inline">{elem}</span>
                          </span>
                          {charCard?.power && (
                            <span className="text-[8px] sm:text-[9px] text-amber-300 font-bold bg-amber-950/40 border border-amber-800/40 px-1 py-0.2 rounded-xs">
                              P.{charCard.power}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Character Card Portrait Box */}
                      <div className="flex-1 flex items-center justify-center p-1.5 sm:p-3 relative overflow-hidden h-32 sm:h-44 md:h-48 min-h-[120px] sm:min-h-[160px] bg-gradient-to-b from-slate-900 via-[#131024] to-[#0a0814]">
                        {/* Background Subtle Ink Grid */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.18),transparent_70%)] pointer-events-none" />
                        
                        {charCard ? (
                          <MissionCharacterPortrait cardId={charCard.id} name={charName} language={language} className="w-full h-full" />
                        ) : (
                          <IconComp size={36} className="text-white/80 drop-shadow-lg my-4" />
                        )}

                        {/* Bottom Overlay Label inside Card Art */}
                        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between pointer-events-none z-30 gap-1">
                          <div className="bg-black/85 backdrop-blur-xs border border-white/15 px-1 py-0.5 rounded-xs text-[8px] sm:text-[9px] text-white font-bold truncate max-w-[70%] shadow-sm">
                            #{cardNumFormatted} {charName}
                          </div>
                          {m.badgeText && (
                            <div className="bg-amber-400 text-slate-950 font-black px-1 py-0.5 rounded-xs text-[7px] sm:text-[8px] uppercase tracking-wider shadow-sm shrink-0">
                              {m.badgeText}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Game Title & Mission Info Bar */}
                      <div className="p-1.5 sm:p-2.5 bg-slate-950 border-t border-slate-800 flex flex-col gap-1 sm:gap-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="flex-1 text-left font-black text-[10px] sm:text-xs text-white truncate drop-shadow-xs">
                            {m.title}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                              setGuideMode(m);
                            }}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer text-[9px] sm:text-[10px] font-black shrink-0"
                            aria-label={language === 'ko' ? '설명 보기' : 'Show Description'}
                          >
                            ?
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                          <span className="truncate text-slate-400 text-[8px] sm:text-[9px]">
                            ✦ <strong className="text-slate-200 font-bold">{charName}</strong>
                          </span>
                          <span className="text-emerald-400 font-bold shrink-0 text-[8px] sm:text-[9px] flex items-center gap-0.5">
                            +SNS <ChevronRight size={10} className="inline text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {/* 인피드 네이티브 광고 카드 — P2-2 */}
              <NativeAd language={language} variant="card" />
            </div>
          </main>

          {/* Help Popup */}
          <AnimatePresence>
            {showHelpPopup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[209] flex items-center justify-center p-4"
              >
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowHelpPopup(false)}
                />
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl max-w-lg w-full relative z-[210] font-sans"
                >
                  <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-white pt-2">
                    <h3 className="text-base font-extrabold text-slate-800">
                      {helpSlideIndex === 0
                        ? (language === 'ko' ? '게임 모드 선택' : 'Game Mode Selection')
                        : helpSlideIndex === 1
                        ? (language === 'ko' ? '모드 카드' : 'Mode Cards')
                        : (language === 'ko' ? '보상' : 'Rewards')}
                    </h3>
                    <button
                      onClick={() => setShowHelpPopup(false)}
                      className="min-w-[36px] min-h-[36px] rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <X size={16} className="text-slate-500" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    {helpSlideIndex === 0
                      ? (language === 'ko'
                        ? '다양한 배틀 모드와 미니게임 중에서 원하는 모드를 선택하세요. 각 모드는 고유한 게임 플레이와 SNS 보상을 제공합니다.'
                        : 'Choose from various battle modes and minigames. Each mode offers unique gameplay and SNS rewards.')
                      : helpSlideIndex === 1
                      ? (language === 'ko'
                        ? '각 카드를 탭하면 해당 게임 모드로 바로 진입합니다. 카드 우측의 ? 버튼을 누르면 상세 설명을 볼 수 있습니다.'
                        : 'Tap any card to enter that game mode. Use the ? button on each card for detailed instructions.')
                      : (language === 'ko'
                        ? '배틀 승리와 미니게임 완료 시 SNS 코인과 카드 경험치를 획득할 수 있습니다.'
                        : 'Winning battles and completing minigames earns you SNS coins and card XP.')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-2 h-2 rounded-full transition-colors',
                            i === helpSlideIndex ? 'bg-indigo-600' : 'bg-slate-200'
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {helpSlideIndex > 0 && (
                        <button
                          onClick={() => setHelpSlideIndex(prev => prev - 1)}
                          className="min-w-[40px] min-h-[40px] rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                          aria-label="Previous"
                        >
                          <ChevronLeft size={16} className="text-slate-600" />
                        </button>
                      )}
                      {helpSlideIndex < 2 ? (
                        <button
                          onClick={() => setHelpSlideIndex(prev => prev + 1)}
                          className="min-w-[40px] min-h-[40px] rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-colors"
                          aria-label="Next"
                        >
                          <ChevronRight size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowHelpPopup(false)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm cursor-pointer transition-colors"
                        >
                          {language === 'ko' ? '완료' : 'Done'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
  
        {/* Under Construction Popup Modal */}
        <AnimatePresence>
          {showConstructionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            >
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={() => setShowConstructionModal(false)}
              />
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-950/95 text-slate-100 w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] border border-slate-800 relative flex flex-col z-[1001] font-sans"
              >
                <div className="p-5 bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 flex items-center justify-between border-b border-amber-700/20">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={24} className="text-slate-950 animate-pulse" />
                    <h2 className="text-lg font-black uppercase tracking-tight leading-none">{t('under_construction_title', language)}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setShowConstructionModal(false);
                    }} 
                    className="bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 p-1.5 transition-all flex items-center justify-center rounded-full cursor-pointer"
                  >
                    <X size={16} className="text-slate-955" />
                  </button>
                </div>
 
                <div className="p-6 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-950/40 border border-amber-550 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-bounce">
                    <Activity size={28} className="text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black italic text-amber-400 bg-amber-950/30 px-4 py-1.5 rounded-xl border border-amber-900/50 inline-block">
                    {selectedConstructionMode}
                  </h3>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed pt-2">
                     {t('under_construction_desc', language)}
                  </p>
                </div>
 
                <div className="p-5 border-t border-slate-900 bg-slate-950/60 flex justify-center">
                  <button
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setShowConstructionModal(false);
                    }}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-bold uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {t('under_construction_close', language)}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {guideMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            >
              <div className="absolute inset-0" onClick={() => setGuideMode(null)} />
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white text-slate-800 w-full max-w-md rounded-3xl overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.3)] border-2 border-slate-300 relative flex flex-col z-[1001] font-sans"
              >
                <div className={cn(
                  "p-5 border-b-2 border-slate-200 text-white flex items-center justify-between bg-gradient-to-br",
                  guideMode.color
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <guideMode.icon size={22} className="text-white" />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-tight">{guideMode.title}</h2>
                  </div>
                  <button 
                    onClick={() => setGuideMode(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                    {guideMode.guide}
                  </p>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                  <button
                    onClick={() => setGuideMode(null)}
                    className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm"
                  >
                    {language === 'ko' ? '확인' : 'OK'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                className="bg-slate-950/95 text-slate-100 w-full max-w-sm rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.15)] border border-slate-800 relative z-[10000] font-sans"
              >
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-b border-orange-600/10 flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} className="text-white" />
                  </div>
                  <h2 className="text-base font-bold uppercase tracking-tight leading-tight">{confirmModal.title}</h2>
                </div>
 
                {/* Body */}
                <div className="p-6">
                  <p className="text-sm font-semibold text-slate-350 leading-relaxed whitespace-pre-line">{confirmModal.message}</p>
                </div>
 
                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold text-sm rounded-xl transition-colors duration-200"
                  >
                    {language === 'ko' ? '취소' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="flex-1 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-500 transition-colors duration-200 shadow-lg shadow-indigo-600/25 active:scale-95"
                  >
                    {language === 'ko' ? '확인' : 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {renderCustomAlertModal()}
      </div>
      </div>
    );
  }

  if (gameState === 'preMatch' && selectedOpponent) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white overflow-y-auto relative pb-20">
        <header className="h-16 flex items-center justify-between border-b border-white/10 px-6 z-50 bg-black/50 backdrop-blur-md relative">
          <div className="w-10" />
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-none">
            <h2 className="text-xl font-bold italic tracking-tight leading-none uppercase text-center">{t('pre_match_setup', language)}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-[10px] font-black opacity-40 tracking-widest uppercase text-center">{t('matrix_calibration', language)}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto">
          {/* Opponent Identity */}
          <div className="flex flex-col items-center gap-4">
             <div className="w-32 h-32 rounded-3xl border-4 border-red-500/50 bg-red-500/10 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.2)]">
               <img 
                 src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${selectedOpponent.id}&backgroundColor=b6e3f4`} 
                 alt="Robot" 
                 className="w-full h-full object-cover pixelated"
                 referrerPolicy="no-referrer"
               />
             </div>
             <div className="text-center">
                <div className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">{t('opponent_detected', language)}</div>
                <div className="text-2xl font-black italic uppercase">{selectedOpponent.name}</div>
             </div>
          </div>

          {/* Faction Matchup Info — 세력 상성 정보 */}
          {battleType !== 'matgo' && playerDeck.length > 0 && previewDeck.length > 0 && (() => {
            const playerRep = playerDeck[0];
            const opponentRep = previewDeck[0];
            if (!playerRep || !opponentRep) return null;
            const synergyPreview = calculateBattleSynergy(playerRep, opponentRep, playerRep.equipment);
            const advantage = synergyPreview.factionAdvantage;
            const icon = FACTION_ADVANTAGE_ICONS[advantage];
            const colorClass = FACTION_ADVANTAGE_COLORS[advantage];
            const label = advantage === 'advantage'
              ? t('matchup_advantage', language)
              : advantage === 'disadvantage'
              ? t('matchup_disadvantage', language)
              : t('matchup_neutral', language);
            const equipmentLabel = synergyPreview.equipmentSetName
              ? `${EQUIPMENT_SET_ICONS[synergyPreview.equipmentSetName] || ''} ${synergyPreview.equipmentSetName.toUpperCase()} +${synergyPreview.equipmentPowerBonus}⚡`
              : t('synergy_no_bonus', language);
            return (
              <div className={`w-full max-w-sm rounded-xl border px-4 py-3 text-center ${advantage === 'advantage' ? 'border-green-500/30 bg-green-950/20' : advantage === 'disadvantage' ? 'border-red-500/30 bg-red-950/20' : 'border-slate-700 bg-slate-900/30'}`}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  {t('matchup_faction_hint', language)}
                </p>
                <p className={`text-sm font-black ${colorClass}`}>
                  {icon} {label} · x{synergyPreview.factionMultiplier.toFixed(2)}
                </p>
                <p className="mt-2 text-[10px] font-semibold text-slate-300">
                  {t('synergy_equipment_bonus', language)} · {equipmentLabel}
                </p>
              </div>
            );
          })()}

          <div className="w-full max-w-sm space-y-6">
            {weeklyWebtoon && (
              <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/15 via-slate-950 to-slate-900 p-4 shadow-[0_0_30px_rgba(99,102,241,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-indigo-300/80 mb-1">{t('webtoon_hub_title', language)}</p>
                    <h3 className="text-lg font-black italic uppercase leading-tight text-white">{weeklyWebtoon.titleKo}</h3>
                    <p className="mt-2 text-xs font-medium leading-relaxed text-slate-300">{language === 'ko' ? weeklyWebtoon.summaryKo : weeklyWebtoon.summaryEn}</p>
                  </div>
                  <div className="shrink-0 rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('home_story_progress', language)}</p>
                    <p className="text-sm font-black text-indigo-300">{storyProgressCount}/{totalStoryEpisodes}</p>
                    <p className="text-[10px] font-bold text-slate-500">{storyProgressPercent}%</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setView?.('webtoon')}
                    className="flex-1 min-h-11 rounded-2xl bg-white text-slate-950 font-black uppercase tracking-wider text-[11px] px-4 py-3 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    {t('world_open_webtoon', language)}
                  </button>
                  <button
                    onClick={() => setIsStoryStageModalOpen(true)}
                    className="flex-1 min-h-11 rounded-2xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 font-black uppercase tracking-wider text-[11px] px-4 py-3 hover:bg-indigo-500/20 transition-all cursor-pointer"
                  >
                    {t('story_title', language)}
                  </button>
                </div>
              </div>
            )}


            {/* Deck Preview Toggle */}
            {battleType !== 'matgo' && (
              <div className="space-y-3 pb-4 pt-2">
                <button
                  onClick={() => {
                    setShowPreviewDeck(!showPreviewDeck);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-900/90 border border-slate-800 rounded-xl hover:bg-slate-850 hover:border-slate-700 transition-all font-black uppercase tracking-widest text-sm text-slate-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Eye size={18} className="text-blue-400" />
                    <span>{t('opponent_deck_preview', language)}</span>
                  </div>
                  {showPreviewDeck ? <ChevronUp size={16} /> : <EyeOff size={16} />}
                </button>
                
                <AnimatePresence>
                  {showPreviewDeck && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {previewDeck.map((card, idx) => (
                          <div key={idx} className="w-[18%] max-w-[80px] shrink-0 aspect-[5/7]">
                             <CardItem 
                               card={card} 
                               isLocked={true} 
                               className="w-full h-full"
                               lowSpecMode={lowSpecMode}
                             />
                          </div>
                        ))}
                      </div>

                      {/* Item 354: PreMatch Counter Deck Auto-Equip */}
                      {previewDeck.length > 0 && (
                        <button
                          onClick={() => {
                            const counterDeckIds = generateCounterDeck(previewDeck, CARD_DATABASE);
                            const season = localStorage.getItem('hero_current_season') || 'season1';
                            setSeasonItem('hero_deck', season, JSON.stringify(counterDeckIds));
                            setSeasonItem('hero_deck_guest', season, JSON.stringify(counterDeckIds));
                            window.dispatchEvent(new Event('snshero_deck_updated'));
                            playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                            triggerHaptic('medium');
                            triggerAlert(
                              language === 'ko'
                                ? `상대 덱에 가장 유리한 상성 5장의 카드(#${counterDeckIds.join(', #')})가 자동으로 장착되었습니다!`
                                : `Recommended counter deck (#${counterDeckIds.join(', #')}) has been equipped!`,
                              language === 'ko' ? '카운터 덱 자동 장착' : 'Counter Deck Equipped'
                            );
                          }}
                          className="w-full mt-2 py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer font-mono text-xs font-bold shadow-xs"
                        >
                          <Zap size={14} className="text-amber-400 animate-pulse" />
                          <span>{language === 'ko' ? '⚡ 추천 상성 카운터 덱 자동 장착' : '⚡ Equip Counter Deck'}</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Launch Button */}
            <button
              onClick={() => {
                const autoSetting = localStorage.getItem('hero_auto_battle_setting');
                const autoEnabled = autoSetting === null ? true : JSON.parse(autoSetting) === true;
                if (autoEnabled) setIsAutoBattle?.(true);
                startRobotMatch(selectedOpponent);
              }}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-4 group transition-all shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer mb-8 border border-blue-500/30 font-sans"
            >
              <Swords className="group-hover:rotate-12 transition-transform" />
              <span className="text-lg font-black italic uppercase tracking-wider">{t('initiate_battle', language)}</span>
              <Zap size={20} className="text-yellow-400 group-hover:scale-125 transition-transform animate-pulse" />
            </button>
          </div>
          {renderCustomAlertModal()}
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className="flex-1 flex flex-col w-full bg-slate-950 text-slate-100 overflow-y-auto relative min-h-0">
        <AnimatePresence>
          {showRules && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            >
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={() => setShowRules(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-950/95 text-slate-100 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.2)] relative flex flex-col max-h-[80vh] border border-slate-850"
              >
                <div className="p-6 bg-gradient-to-r from-indigo-955 to-slate-955 text-white flex items-center justify-between border-b border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <HelpCircle size={24} className="text-amber-400 animate-pulse" />
                    <h2 className="text-xl font-extrabold uppercase tracking-tight">{t('game_rules', language)}</h2>
                  </div>
                  <button onClick={() => setShowRules(false)} className="bg-white/25 hover:bg-white/40 p-2 rounded-full transition-all flex items-center justify-center">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8 font-sans">
                  {/* Basic How to Play */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Info size={18} />
                      <h3 className="font-bold uppercase text-sm">{t('how_to_play', language)}</h3>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(num => (
                        <div key={num} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                          <div className="text-xs font-bold text-indigo-400 uppercase mb-1">{t(`rule_${num}_title` as any, language)}</div>
                          <div className="text-[11px] font-medium text-slate-350 leading-relaxed">{t(`rule_${num}_desc` as any, language)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Abilities Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-400">
                      <Zap size={18} />
                      <h3 className="font-bold uppercase text-sm">{t('ability_types', language)}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(['outline_shield' as any, 'outline_power_boost' as any, 'outline_weaken' as any, 'outline_reinforce' as any] as const).map(type => {
                        const baseType = type.replace('outline_', '');
                        return (
                          <div key={type} className="flex gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 items-center">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 shadow-sm",
                              baseType === 'shield' ? "bg-blue-500" :
                              baseType === 'power_boost' ? "bg-amber-500" :
                              baseType === 'weaken' ? "bg-purple-650" : "bg-emerald-500"
                            )}>
                              <Sparkles size={14} className="text-white" />
                            </div>
                            <div className="text-[11px] font-medium text-slate-355 leading-snug">
                              {t(`ability_${baseType}` as any, language)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-900 bg-slate-950/60">
                  <button 
                    onClick={() => setShowRules(false)}
                    className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-550 text-white rounded-2xl font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                  >
                    {t('close', language)}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header and Instructions removed to maximize map visibility. */}

        {isGpsActive && gpsCoords ? (
          /* GPS Mode: Leaflet Map Background */
          <div className="flex-1 relative w-full h-full overflow-hidden">
            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Premium Workout Floating Dashboard Card */}
            <div className="absolute top-24 right-4 z-50 pointer-events-auto max-w-sm w-[260px] animate-fade-in">
              <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-2xl shadow-[0_4px_24px_rgba(6,182,212,0.15)] text-white space-y-4 font-sans">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Activity size={18} className="animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest italic">WORKOUT STATS</span>
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
                  🏃 {language === 'ko' ? "10m를 걸어 다닐 때마다\n가장 가까운 AI와 자동으로 전투가 시작됩니다!" : "Walk 10m to auto-trigger\nbattle with the nearest AI!"}
                </div>
              </div>
            </div>

            {/* Map Interaction Hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-955/90 backdrop-blur-md text-white px-4 py-2.5 text-[10px] font-semibold rounded-full shadow-lg pointer-events-none tracking-tight uppercase whitespace-nowrap border border-white/5 font-sans">
              📍 {language === 'ko' ? "지도의 빨간 마커를 탭하면 전투를 시작할 수 있습니다." : "TAP RED MARKERS TO ENGAGE AI ROBOT"}
            </div>
          </div>
        ) : (
          /* Lobby World - Bright Cyberpunk Night City Style */
          <div 
            ref={lobbyRef}
            onClick={handleLobbyClick}
            className="flex-1 relative bg-[#1a1a2e] overflow-hidden cursor-crosshair"
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

            {/* Space Objects - Fixed Top */}
            <div className="absolute top-5 left-[15%] text-4xl opacity-60 animate-pulse">🛰️</div>
            <div className="absolute top-8 right-[25%] text-5xl opacity-50 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">🚀</div>
            <div className="absolute top-12 left-[40%] text-2xl opacity-40">🌌</div>
            <div className="absolute top-6 right-[10%] text-3xl opacity-50 animate-bounce-slow">🛰️</div>

            {/* Dense Futuristic City Buildings */}
            <div className="absolute top-1/4 left-10 text-7xl opacity-60 select-none pointer-events-none drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">🏙️</div>
            <div className="absolute top-1/4 left-32 text-6xl opacity-40 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(255,0,255,0.6)]">🏢</div>
            <div className="absolute top-[30%] right-[15%] text-7xl opacity-50 select-none pointer-events-none drop-shadow-[0_0_20px_rgba(255,0,255,0.8)]">🗼</div>
            <div className="absolute top-[35%] right-[5%] text-5xl opacity-40 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">🏬</div>
            <div className="absolute bottom-1/3 left-1/4 text-6xl opacity-40 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(255,255,0,0.6)]">📡</div>
            <div className="absolute bottom-1/4 right-[20%] text-7xl opacity-60 select-none pointer-events-none drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]">🏙️</div>
            <div className="absolute bottom-[30%] left-[5%] text-5xl opacity-30 select-none pointer-events-none">🏢</div>
            <div className="absolute bottom-[15%] right-[40%] text-6xl opacity-50 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(255,255,0,0.7)]">🏙️</div>
            <div className="absolute top-[45%] left-[45%] text-4xl opacity-30 select-none pointer-events-none">🏬</div>
            
            <div className="absolute top-[15%] left-[40%] text-5xl opacity-40 select-none pointer-events-none">🔌</div>
            <div className="absolute top-[20%] left-[45%] text-4xl opacity-30 select-none pointer-events-none">⚡</div>
            
            {/* Digital Scanner UI */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-60 pointer-events-none select-none flex flex-col items-center">
               <div className="w-28 h-28 border-2 border-[#0ff] rounded-full flex items-center justify-center relative animate-spin-slow">
                  <div className="absolute inset-0 border-t-4 border-[#f0f] rounded-full" />
                  <div className="w-1 h-32 bg-[#0ff]/40 absolute" />
                  <div className="w-32 h-1 bg-[#0ff]/40 absolute" />
                  <div className="text-[10px] font-black text-[#0ff] mt-16 tracking-widest uppercase bg-black/40 px-2 py-0.5 rounded">MAP_SCANNER_v2</div>
               </div>
            </div>

            {/* District Labels */}
            <div className="absolute top-[18%] right-[10%] text-[#f0f] text-[10px] font-black italic tracking-widest opacity-60 uppercase border-r-2 border-[#f0f] pr-2">Sector_01_Watson</div>
            <div className="absolute bottom-[20%] left-[10%] text-[#0ff] text-[10px] font-black italic tracking-widest opacity-60 uppercase border-l-2 border-[#0ff] pl-2">Sector_04_Pacific</div>
            <div className="absolute bottom-[40%] right-[30%] text-[#ff0] text-[10px] font-black italic tracking-widest opacity-60 uppercase border-b-2 border-[#ff0] pb-1">Night_City_Center</div>

            {/* Static Background Grid */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-[0.1] pointer-events-none">
              {Array(144).fill(null).map((_, i) => (
                <div key={`grid-${i}`} className="border border-gray-800" />
              ))}
            </div>

            {/* Guest Badge in Lobby */}
            <div className="absolute left-4 top-4 flex flex-col gap-3 z-[60]">
              {!effectiveUser && (
                <div className="bg-amber-500 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/20 animate-pulse">
                  AI_BATTLE_ONLY (GUEST)
                </div>
              )}
            </div>

            {/* Auto Battle Stats & Strategy Overlay */}
            <div className="absolute bottom-24 md:bottom-32 left-4 md:left-8 z-50 flex flex-col items-start gap-2 pointer-events-none">
              {isAutoBattle && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-2xl text-slate-100 font-sans text-[10px] space-y-2 shadow-xl min-w-[140px] pointer-events-auto"
                >
                   <div className="flex justify-between gap-4 border-b border-slate-800 pb-1">
                     <span className="text-indigo-400 font-bold uppercase tracking-wider">AUTO_BATTLE</span>
                   </div>
                   <div className="flex justify-between gap-2 border-b border-slate-800 pb-1 text-slate-300">
                     <span className="opacity-50 uppercase whitespace-nowrap">Sess_Rec</span>
                     <span className="font-bold whitespace-nowrap text-right">
                       {autoBattleStats.wins}W {autoBattleStats.losses}L {autoBattleStats.draws}D
                     </span>
                   </div>
                   <div className="flex justify-between items-center text-slate-300">
                     <span className="text-[9px] uppercase tracking-wider opacity-50">Win Rate</span>
                     <span className="text-indigo-400 font-bold">
                       {((autoBattleStats.wins / (Math.max(1, autoBattleStats.wins + autoBattleStats.losses + autoBattleStats.draws))) * 100).toFixed(1)}%
                     </span>
                   </div>
                   {lastBattleSummaryData && (
                     <button
                       type="button"
                       onClick={(e) => {
                         e.stopPropagation();
                         setShowPostBattleSummaryModal(true);
                       }}
                       className="w-full mt-1 py-1 px-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-lg text-[9px] font-bold text-indigo-200 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
                     >
                       <BarChart3 size={11} className="text-indigo-400" />
                       <span>{language === 'ko' ? '📊 직전 전투 분석' : '📊 Last Battle'}</span>
                     </button>
                   )}
                </motion.div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4 z-[60] pointer-events-none">
                <button 
                  onClick={(e) => { e.stopPropagation(); setLobbyPage(p => Math.max(0, p - 1)); }}
                  disabled={lobbyPage === 0}
                  className={cn(
                    "w-12 h-12 bg-slate-900/85 backdrop-blur-sm text-slate-200 rounded-full flex items-center justify-center pointer-events-auto border border-slate-800 shadow-lg transition-all hover:bg-slate-800/85 active:scale-90",
                    lobbyPage === 0 ? "opacity-0 invisible" : "visible"
                  )}
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setLobbyPage(p => Math.min(totalPages - 1, p + 1)); }}
                  disabled={lobbyPage >= totalPages - 1}
                  className={cn(
                    "w-12 h-12 bg-slate-900/85 backdrop-blur-sm text-slate-200 rounded-full flex items-center justify-center pointer-events-auto border border-slate-800 shadow-lg transition-all hover:bg-slate-800/85 active:scale-90",
                    lobbyPage >= totalPages - 1 ? "opacity-0 invisible" : "visible"
                  )}
                >
                  <ChevronLeft size={32} className="rotate-180" />
                </button>
            </div>

            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40">
                <div className="bg-slate-900/85 backdrop-blur-sm text-slate-200 px-4 py-2 text-xs font-semibold border border-slate-800 rounded-2xl flex items-center gap-2 shadow-md">
                   <Users size={16} className="text-indigo-400" />
                   <span>PAGE {lobbyPage + 1} / {Math.max(1, totalPages)}</span>
                </div>
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
                  handleEncounter(char);
                }}
              >
                <div className="relative group cursor-pointer">
                  {/* Speech Bubble */}
                  {bubbles[char.id] && (
                    <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 bg-slate-900/95 text-slate-105 text-sm font-bold px-3 py-1.5 border border-slate-850 rounded-lg whitespace-nowrap z-50 shadow-[0_4px_15px_rgba(0,0,0,0.4)]">
                      {bubbles[char.id].text.length > 5 ? bubbles[char.id].text.substring(0, 5) + '...' : bubbles[char.id].text}
                      {/* Bubble Tail */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-slate-850 border-r-[6px] border-r-transparent"></div>
                      <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-t-[6px] border-t-slate-900 border-r-[4px] border-r-transparent"></div>
                    </div>
                  )}
                  
                  {/* AI Tag */}
                  {char.type === 'robot' && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-650 text-white text-sm font-bold px-1.5 py-0.5 shadow-sm z-50 rounded-sm">
                      AI
                    </div>
                  )}
                  
                  <div className={cn(
                    "p-1 border border-slate-800 rounded-2xl group-hover:border-indigo-400 hover:shadow-lg transition-all transform active:scale-95 bg-slate-900 overflow-hidden w-12 h-12 flex items-center justify-center shadow-md"
                  )}>
                    {char.type === 'robot' ? (
                      <img 
                        src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${char.id}&backgroundColor=b6e3f4`} 
                        alt="Robot" 
                        className={cn(
                          "w-full h-full object-cover pixelated"
                        )}
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

            {/* Player character (Static center-ish for focus) */}
            <motion.div 
              animate={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute flex flex-col items-center pointer-events-none z-20 group"
            >
               <div className="relative pointer-events-auto">
                  {/* Speech Bubble */}
                  {bubbles['self'] && (
                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm font-bold px-3 py-1.5 border border-gray-200 rounded-lg whitespace-nowrap z-50">
                      {bubbles['self'].text.length > 5 ? bubbles['self'].text.substring(0, 5) + '...' : bubbles['self'].text}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-black border-r-[6px] border-r-transparent"></div>
                      <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-t-[6px] border-t-blue-600 border-r-[4px] border-r-transparent"></div>
                    </div>
                  )}

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
               <div className="mt-1 text-xs font-bold bg-indigo-600 text-white px-2.5 py-0.5 text-center tracking-tight w-max rounded-full absolute left-1/2 -translate-x-1/2 top-full shadow-md shadow-indigo-600/20 animate-pulse">
                 YOU
               </div>
            </motion.div>

          </div>
        )}
        {renderCustomAlertModal()}
      </div>
    );
  }

  if (gameState === 'searching' || isCoinFlipping) {
    return (
      <>
        {renderRulesPopup()}
        <div className="flex flex-col flex-1 h-full w-full bg-[#030712] font-sans items-center justify-center p-8 text-center overflow-hidden relative text-white">
          {/* Cyberpunk Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse [animation-delay:1s]" />

          <AnimatePresence>
            {isCoinFlipping ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-48 h-48 mb-12">
                  <motion.div
                    animate={!coinWinner ? { 
                      rotateY: [0, 180, 360, 540, 720, 900, 1080, 1260, 1440],
                      scale: [1, 1.1, 1, 1.1, 1],
                      y: [0, -50, 0, -50, 0],
                      boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)'
                    } : { 
                      rotateY: coinWinner === 'player' ? 0 : 180, 
                      scale: [1.5, 1.75, 1.55], 
                      y: 0,
                      boxShadow: coinWinner === 'player' 
                        ? '0px 0px 40px 20px rgba(59, 130, 246, 0.95), 0px 0px 15px 5px rgba(251, 191, 36, 0.8)' 
                        : '0px 0px 40px 20px rgba(239, 68, 68, 0.95), 0px 0px 15px 5px rgba(251, 191, 36, 0.8)'
                    }}
                    transition={!coinWinner ? { duration: 1.5, ease: "easeInOut" } : { 
                      rotateY: { duration: 0.3, ease: "easeOut" }, 
                      scale: { duration: 0.6, times: [0, 0.4, 1], ease: "backOut" },
                      boxShadow: { duration: 0.6 }
                    }}
                    className="w-full h-full relative rounded-2xl"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div 
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-850 border flex items-center justify-center p-4 transition-all duration-300 shadow-[0_0_25px_rgba(59,130,246,0.3)]",
                        coinWinner === 'player' ? "border-yellow-400 border-4 scale-105" : "border-slate-700 border"
                      )} 
                      style={{ backfaceVisibility: 'hidden', borderRadius: '16px' }}
                    >
                      {effectiveUser?.photoURL?.startsWith('preset:') ? (
                        <img 
                          src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero-${effectiveUser.photoURL.split(':')[1]}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                          alt="Hero"
                          className="w-full h-full object-cover pixelated rounded-lg"
                        />
                      ) : (
                        <img 
                          src={effectiveUser?.photoURL || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hero&backgroundColor=3b82f6`} 
                          alt="Hero" 
                          className="w-full h-full object-cover pixelated rounded-lg" 
                        />
                      )}
                    </div>
                    <div 
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br from-rose-600 to-red-850 border flex items-center justify-center p-4 transition-all duration-300 shadow-[0_0_25px_rgba(244,63,94,0.3)]",
                        coinWinner === 'ai' ? "border-yellow-400 border-4 scale-105" : "border-slate-700 border"
                      )} 
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: '16px' }}
                    >
                      <img 
                        src={lastOpponent ? 
                          (lastOpponent.type === 'robot' 
                            ? `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${lastOpponent.id}&backgroundColor=dc2626` 
                            : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${lastOpponent.id}&backgroundColor=c0aede`) 
                          : `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=OpponentBot&backgroundColor=dc2626`} 
                        alt="Opponent" 
                        className="w-full h-full object-cover pixelated rounded-lg" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                </div>
                <AnimatePresence mode="wait">
                  {coinWinner ? (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-2">
                      <h2 className={cn("text-4xl font-extrabold italic tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]", coinWinner === 'player' ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "text-transparent bg-clip-text bg-gradient-to-r from-rose-450 to-red-450 to-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]")}>
                        {coinWinner === 'player' ? "YOU START" : "OPPONENT STARTS"}
                      </h2>
                      <p className="text-xs font-black text-slate-500 tracking-[0.3em]">PROTOCOL_INITIATED</p>
                    </motion.div>
                  ) : (
                    <motion.div key="waiting" className="space-y-1">
                      <h2 className="text-4xl font-black italic tracking-wider text-slate-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">DECIDING TURN...</h2>
                      <p className="text-xs font-black text-blue-500/70 tracking-[0.2em] animate-pulse">SCANNING_ENTROPY</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36 mb-10 flex items-center justify-center">
                  {/* Radar scanning Sweep */}
                  <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-pulse"></div>
                  <div className="absolute inset-2 rounded-full border border-blue-500/10"></div>
                  <div className="absolute inset-6 rounded-full border border-dashed border-blue-500/15 animate-spin [animation-duration:10s]"></div>
                  
                  {/* Outer Glow ring */}
                  <div className="absolute inset-0 w-full h-full rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                  {/* Inner Glow ring reversed */}
                  <div className="absolute w-24 h-24 rounded-full border-2 border-b-purple-500 border-t-transparent border-r-transparent border-l-transparent animate-spin [animation-direction:reverse] [animation-duration:1.5s]"></div>
                  
                  <div className="text-blue-400 animate-pulse">
                    <Swords size={36} className="drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <motion.h2 
                    animate={{ opacity: [1, 0.5, 1] }} 
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-3xl font-black tracking-widest text-blue-400 italic drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                  >
                    BATTLE_MATCHMAKING
                  </motion.h2>
                  <div className="text-xs font-black text-slate-400/85 tracking-widest leading-loose bg-slate-900/60 px-6 py-4 border border-slate-800 rounded-2xl backdrop-blur-md shadow-inner">
                    SYNCHRONIZING COMBAT DATA...<br/>
                    LOADING BATTLE MATRIX_0xAF<br/>
                    PREPARING DEPLOYMENT...
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Opponent Deck Preview Toggle */}
          {opponentDeck.length > 0 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4">
              <AnimatePresence>
                {showDeckPreview && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 p-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] w-[90vw] max-w-lg mb-4 text-white"
                  >
                    <div className="flex items-center justify-between mb-3 px-2">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] animate-pulse">
                        Intel: Opponent_Squad
                      </span>
                      <span className="text-[9px] text-white/30 uppercase">
                        Security_Bypass: Active
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {opponentDeck.map((card, idx) => (
                        <div key={idx} className="w-16 md:w-20 shrink-0 first:ml-0 last:mr-0 aspect-[5/7]">
                          <CardItem 
                            card={card} 
                            isLocked={true} 
                            className="w-full h-full scale-90"
                            lowSpecMode={lowSpecMode}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => {
                   setShowDeckPreview(!showDeckPreview);
                   playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                 }}
                 className={cn(
                   "flex items-center gap-3 px-6 py-2.5 rounded-full border shadow-2xl transition-all uppercase text-[10px] font-black tracking-widest",
                   showDeckPreview 
                    ? "bg-white text-black border-white" 
                    : "bg-black text-white border-white/20 hover:border-white/50"
                 )}
              >
                <Swords size={14} className={cn(showDeckPreview ? "text-blue-600" : "text-red-600")} />
                {showDeckPreview ? "DISMISS_INTEL" : "PREVIEW_OPPONENT_DECK"}
              </motion.button>
            </div>
          )}
          {renderCustomAlertModal()}
        </div>
      </>
    );
  }


  return (
    <div id="game-board" className="flex-1 flex flex-col w-full bg-[#060a14] text-slate-100 pb-4 pt-11 sm:pt-12 overflow-y-auto relative min-h-full justify-between">
      {/* Battle Roar Wave Ripple Effect Overlay */}
      <AnimatePresence>
        {isRoarActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center overflow-hidden"
          >
            <div className="absolute w-[200px] h-[200px] border-8 border-red-500 rounded-full animate-roar-ripple opacity-80" />
            <div className="absolute w-[200px] h-[200px] border-8 border-orange-500 rounded-full animate-roar-ripple opacity-60" style={{ animationDelay: '0.3s' }} />
            <div className="absolute w-[200px] h-[200px] border-8 border-yellow-500 rounded-full animate-roar-ripple opacity-40" style={{ animationDelay: '0.6s' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Circular Robot Auto-Battle Button, Speed Toggle & Grid Skills */}
      {gameState === 'playing' && !gameOver && (
        <div className="fixed bottom-28 right-3 sm:right-4 z-[160] pointer-events-auto flex flex-col items-end gap-2.5">
          {/* 1. Auto-Battle Speed & Robot Toggle */}
          <div className="flex items-center gap-2">
            {/* Item 346: 3-Speed Turbo Mode Toggle (Visible during Auto Battle) */}
            {isAutoBattle && (
              <button
                type="button"
                onClick={toggleAutoSpeed}
                className={cn(
                  "px-2.5 py-1.5 rounded-sm border font-mono text-[11px] font-black shadow-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95",
                  autoSpeedMode === '3x'
                    ? "bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse"
                    : autoSpeedMode === '2x'
                    ? "bg-amber-950/90 border-amber-500 text-amber-300"
                    : "bg-slate-900/90 border-slate-700 text-slate-300"
                )}
                title={language === 'ko' ? `배속 전환: 현재 ${autoSpeedMode.toUpperCase()}` : `Speed: Current ${autoSpeedMode.toUpperCase()}`}
              >
                <Zap size={12} className={cn(autoSpeedMode === '3x' ? "text-yellow-400 animate-spin" : "text-amber-400")} />
                <span>{autoSpeedMode === '3x' ? '[ 3X TURBO ]' : `[ ${autoSpeedMode.toUpperCase()} ]`}</span>
              </button>
            )}

            {(onToggleAutoBattle || setIsAutoBattle) && (
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    if (onToggleAutoBattle) {
                      onToggleAutoBattle();
                    } else if (setIsAutoBattle) {
                      const nextVal = !isAutoBattle;
                      setIsAutoBattle(nextVal);
                      localStorage.setItem('hero_auto_battle_setting', JSON.stringify(nextVal));
                    }
                  }}
                  className={cn(
                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 shadow-2xl flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer touch-target relative",
                    isAutoBattle
                      ? "bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-amber-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.85)] ring-2 ring-amber-300/80"
                      : "bg-slate-950/90 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white shadow-xl"
                  )}
                  title={isAutoBattle ? (language === 'ko' ? '자동전투 ON (클릭 시 중단)' : 'AUTO ON (CLICK TO STOP)') : (language === 'ko' ? '자동전투 OFF (클릭 시 시작)' : 'AUTO OFF (CLICK TO START)')}
                  aria-label="Auto Battle Toggle"
                >
                  <Bot
                    size={26}
                    className={cn(
                      "transition-transform",
                      isAutoBattle ? "animate-spin text-slate-950 drop-shadow-md" : "text-slate-300"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute -bottom-1 -right-1 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full border shadow-md uppercase tracking-tighter",
                      isAutoBattle
                        ? "bg-rose-600 border-rose-300 text-white animate-pulse"
                        : "bg-slate-800 border-slate-600 text-slate-400"
                    )}
                  >
                    {isAutoBattle ? 'AUTO' : 'OFF'}
                  </span>
                </button>

                <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-black/95 backdrop-blur-md text-white px-2.5 py-1 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/20 rounded-md uppercase tracking-wider z-[200] shadow-xl">
                  {isAutoBattle
                    ? (language === 'ko' ? '🤖 자동전투 중단하기' : '🤖 STOP AUTO BATTLE')
                    : (language === 'ko' ? '🤖 자동전투 시작하기' : '🤖 START AUTO BATTLE')}
                </div>
              </div>
            )}
          </div>

          {/* 2. Grid Skills (Rendered directly under the Robot button) */}
          {(() => {
            const availableSkills = getAvailableSkills();
            if (availableSkills.length === 0) return null;

            return availableSkills.map(skillId => {
              let skillNameKo = '';
              let skillNameEn = '';
              let Icon = Flame;
              let colorClass = '';

              switch (skillId) {
                case 1:
                  skillNameKo = '강화 함성';
                  skillNameEn = 'Rallying Roar';
                  Icon = Flame;
                  colorClass = 'border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white';
                  break;
                case 2:
                  skillNameKo = '약화 저주';
                  skillNameEn = 'Weaken Curse';
                  Icon = Droplets;
                  colorClass = 'border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white';
                  break;
                case 3:
                  skillNameKo = '변화 함성';
                  skillNameEn = 'Shift Roar';
                  Icon = Sparkles;
                  colorClass = 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-600 hover:text-white';
                  break;
                case 4:
                  skillNameKo = '변화 저주';
                  skillNameEn = 'Shift Curse';
                  Icon = ShieldAlert;
                  colorClass = 'border-purple-500/50 text-purple-400 hover:bg-purple-600 hover:text-white';
                  break;
                case 5:
                  skillNameKo = '약화 함정';
                  skillNameEn = 'Weaken Trap';
                  Icon = TargetIcon;
                  colorClass = 'border-purple-500/50 text-purple-400 hover:bg-purple-600 hover:text-white';
                  break;
                case 6:
                  skillNameKo = '강화 함정';
                  skillNameEn = 'Rally Trap';
                  Icon = TargetIcon;
                  colorClass = 'border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white';
                  break;
                case 7:
                  skillNameKo = '체인지 상대카드';
                  skillNameEn = 'Swap Enemy';
                  Icon = RotateCcw;
                  colorClass = 'border-orange-500/50 text-orange-400 hover:bg-orange-600 hover:text-white';
                  break;
                case 8:
                  skillNameKo = '체인지 내카드';
                  skillNameEn = 'Swap Self';
                  Icon = RotateCcw;
                  colorClass = 'border-green-500/50 text-green-400 hover:bg-green-600 hover:text-white';
                  break;
              }

              const displayName = language === 'ko' ? skillNameKo : skillNameEn;

              return (
                <div key={skillId} className="relative group flex items-center justify-center">
                  {(skillCooldowns[skillId] || 0) > 0 ? (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-gray-600 bg-gray-800 text-gray-400 flex items-center justify-center font-black text-xs shadow-lg">
                      <span>{skillCooldowns[skillId]}s</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleExecuteSkill(skillId)}
                      disabled={isRoarActive}
                      className={cn(
                        "w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-black/90",
                        !isRoarActive
                          ? colorClass
                          : "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                      )}
                      title={displayName}
                    >
                      <Icon size={18} className={cn(!isRoarActive && skillId === 1 && "animate-pulse")} />
                    </button>
                  )}
                  <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-black/95 backdrop-blur-md text-white px-2.5 py-1 text-[10px] font-black italic opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/20 rounded-md uppercase tracking-wider z-[200] shadow-xl">
                    {displayName}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {renderRulesPopup()}

      {/* Skill Action Instruction Banner */}
      <AnimatePresence>
        {activeTrapMode && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-md pointer-events-auto"
          >
            <div className="bg-slate-950/90 border border-amber-500/30 backdrop-blur-md text-amber-400 p-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.15)] flex items-center justify-between gap-4 font-sans">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold animate-pulse text-base">
                  ⚡
                </div>
                <span className="text-sm font-black tracking-tight leading-tight uppercase">
                  {activeTrapMode === 'weaken_trap' || activeTrapMode === 'reinforce_trap'
                    ? t('trap_prompt_install', language)
                    : t('trap_prompt_change', language)}
                </span>
              </div>
              <button
                onClick={() => setActiveTrapMode(null)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer"
              >
                {t('cancel_btn', language)}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forfeit Confirmation Modal */}
      <AnimatePresence>
        {showForfeitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full shadow-[0_20px_50px_rgba(239,68,68,0.25)] text-center space-y-6 text-white"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
                <ShieldAlert size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black tracking-wider text-red-500 uppercase">
                  {language === 'ko' ? '경기 기권 확인' : 'MATCH SURRENDER'}
                </h3>
                <p className="text-sm font-semibold text-slate-300 leading-relaxed">
                  {language === 'ko'
                    ? "정말 경기를 기권하고 나가시겠습니까? (패배로 처리되며 전적에 반영됩니다)"
                    : "Are you sure you want to forfeit this match? (Result: Loss)"}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowForfeitConfirm(false)}
                  className="flex-1 bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl py-3 text-sm font-semibold transition-colors duration-200 cursor-pointer"
                >
                  {t('no_decline', language) || "Cancel"}
                </button>
                <button 
                  onClick={() => {
                    setShowForfeitConfirm(false);
                    handleExitMatch(true);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl py-3 text-sm font-semibold shadow-[0_4px_15px_rgba(239,68,68,0.25)] border border-red-500/30 transition-all cursor-pointer"
                >
                  {t('yes_accept', language) || "Forfeit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Controls Bar: Back/Exit, Menu, Auto Toggle, Rules, Ping */}
      {gameState === 'playing' && (
        <div className="fixed top-2 left-3 right-3 z-[9999] flex items-center justify-between pointer-events-auto font-mono text-xs select-none">
          {/* Left side: Exit/Back, Menu, Mobile Logs */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                if (!gameOver) {
                  setShowForfeitConfirm(true);
                } else {
                  handleExitMatch(false);
                }
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className="h-8 w-8 bg-slate-900/90 border border-slate-800 hover:border-red-500/50 text-slate-200 hover:text-white rounded-xl shadow-md cursor-pointer flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0"
              title={language === 'ko' ? '나가기' : 'Exit'}
              aria-label={language === 'ko' ? '나가기' : 'Exit'}
            >
              <ArrowLeft size={15} className="text-red-400" />
            </button>

            <button
              onClick={() => {
                setShowInGameMenu(true);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className="h-8 w-8 bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 text-slate-200 hover:text-white rounded-xl shadow-md cursor-pointer flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0"
              title={language === 'ko' ? '메뉴' : 'Menu'}
              aria-label={language === 'ko' ? '메뉴' : 'Menu'}
            >
              <Menu size={15} className="text-indigo-400" />
            </button>

            <button
              onClick={() => {
                setShowMobileLogs(!showMobileLogs);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className={cn(
                "h-8 w-8 border rounded-xl shadow-md cursor-pointer flex items-center justify-center transition-all duration-200 active:scale-95 relative shrink-0",
                showMobileLogs 
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]" 
                  : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
              )}
              title={language === 'ko' ? '전투 로그' : 'Battle Log'}
              aria-label={language === 'ko' ? '전투 로그' : 'Battle Log'}
            >
              <Terminal size={15} className="text-amber-400" />
              {gameLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 border border-amber-300 rounded-full text-[8px] font-black text-black flex items-center justify-center shadow-xs">
                  {gameLogs.length > 99 ? '99+' : gameLogs.length}
                </span>
              )}
            </button>
          </div>

          {/* Right side: AI Model & Tactics Button, Chat Toggle, Ping, Rules */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Top AI Model & Tactics Button (Opens AI Model/Tactics Modal & Shows Current Stance) */}
            <button
              type="button"
              onClick={() => {
                setIsGambitModalOpen(true);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className={cn(
                "h-8 px-2 sm:px-2.5 border rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-all duration-200 active:scale-95 shrink-0 font-mono select-none",
                isAutoBattle
                  ? "bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/40"
                  : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
              )}
              title={language === 'ko'
                ? `AI 모델 및 전술 설정 (현재: ${gambitConfig.activeStance === 'attack' ? '⚔️ 공격형' : gambitConfig.activeStance === 'defense' ? '🛡️ 방어형' : '⚖️ 밸런스'} / ${isAutoBattle ? 'AUTO ON' : 'AUTO OFF'})`
                : `AI Model & Tactics (Current: ${gambitConfig.activeStance === 'attack' ? '⚔️ ATK' : gambitConfig.activeStance === 'defense' ? '🛡️ DEF' : '⚖️ BAL'} / ${isAutoBattle ? 'AUTO ON' : 'AUTO OFF'})`}
              aria-label="AI Battle Model and Tactics"
            >
              <Bot size={15} className={cn(isAutoBattle ? "animate-spin text-amber-300" : "text-slate-400")} />
              <span className="text-[11px] font-black">
                {gambitConfig.activeStance === 'attack' ? '⚔️' : gambitConfig.activeStance === 'defense' ? '🛡️' : '⚖️'}
              </span>
              <span className="text-[10px] font-black hidden xs:inline">
                {gambitConfig.activeStance === 'attack' 
                  ? (language === 'ko' ? '공격' : 'ATK') 
                  : gambitConfig.activeStance === 'defense' 
                  ? (language === 'ko' ? '방어' : 'DEF') 
                  : (language === 'ko' ? '균형' : 'BAL')}
              </span>
              {isAutoBattle && (
                <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500 text-black font-black uppercase">
                  AUTO
                </span>
              )}
            </button>

            {onToggleChat && (
              <button
                onClick={() => {
                  onToggleChat();
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                }}
                className={cn(
                  "h-8 w-8 border rounded-xl shadow-md cursor-pointer flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0",
                  isChatOpen
                    ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-pulse"
                    : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                )}
                title={language === 'ko' ? '전투 채팅 열기/닫기' : 'Toggle Battle Chat'}
                aria-label="Toggle Battle Chat"
              >
                <MessageCircle size={15} className={cn(isChatOpen ? "text-white" : "text-slate-400")} />
              </button>
            )}

            <PingIndicator language={language} className="shrink-0" />

            {/* Element Advantage Quick Reference HUD Button */}
            <button
              onClick={() => {
                setShowElementAdvantageModal(true);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className="h-8 px-2 bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 hover:text-white rounded-xl shadow-md cursor-pointer flex items-center gap-1 transition-all duration-200 active:scale-95 shrink-0"
              title={language === 'ko' ? '속성 상성표 퀵 가이드' : 'Element Advantage Guide'}
              aria-label={language === 'ko' ? '속성 상성표' : 'Element Advantage'}
            >
              <Shield size={13} className="text-cyan-400" />
              <span className="text-[10px] font-bold hidden xs:inline">{language === 'ko' ? '상성' : 'ELEM'}</span>
            </button>

            <button
              onClick={() => {
                setShowInGameRules(true);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }}
              className="h-8 w-8 border rounded-xl shadow-md cursor-pointer flex items-center justify-center transition-all duration-200 bg-slate-900/90 border-slate-800 text-indigo-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 shrink-0"
              title={language === 'ko' ? '도움말 및 규칙' : 'Help & Rules'}
              aria-label={language === 'ko' ? '도움말 및 규칙' : 'Help & Rules'}
            >
              <HelpCircle size={15} />
            </button>
          </div>
        </div>
      )}

      {/* In-Game Menu Modal */}
      <AnimatePresence>
        {showInGameMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[350] flex items-center justify-center p-4 font-mono pointer-events-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-2xl p-5 max-w-xs w-full shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Menu size={18} className="text-indigo-400" />
                  <h3 className="font-bold text-sm tracking-wider uppercase">
                    {language === 'ko' ? '메뉴' : 'IN-GAME MENU'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowInGameMenu(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5">
                {/* AI Model & Tactics Setup Button */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setIsGambitModalOpen(true);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-amber-400" />
                    <span>{language === 'ko' ? 'AI 전투 모델 및 전술 설정' : 'AI Battle Model & Tactics'}</span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-black">
                    {gambitConfig.activeStance === 'attack' ? '⚔️' : gambitConfig.activeStance === 'defense' ? '🛡️' : '⚖️'}
                  </span>
                </button>

                {onToggleAutoBattle && (
                  <button
                    onClick={() => {
                      onToggleAutoBattle();
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    }}
                    className={cn(
                      "w-full py-2.5 px-4 rounded-xl border flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer",
                      isAutoBattle
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={16} className={cn(isAutoBattle ? "text-yellow-400 animate-pulse" : "text-slate-400")} />
                      <span>{language === 'ko' ? '자동 전투 빠른 토글' : 'Auto Battle Toggle'}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 font-black">
                      {isAutoBattle ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setShowInGameRules(true);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className="w-full py-2.5 px-4 bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl flex items-center gap-2 font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <HelpCircle size={16} className="text-indigo-400" />
                  <span>{language === 'ko' ? '게임 규칙 및 설명' : 'Game Rules'}</span>
                </button>

                {/* Item 383: Monster Beastarium & Pets */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setIsBeastariumOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-purple-950/40 border border-purple-800/40 hover:bg-purple-900/60 text-purple-200 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🐾</span>
                    <span>{language === 'ko' ? '몬스터 비스티아리움' : 'Beastarium & Pets'}</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">[OPEN]</span>
                </button>

                {/* Item 385: Offline Expedition */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setIsExpeditionOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/60 text-emerald-200 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🧭</span>
                    <span>{language === 'ko' ? '오프라인 원정대' : 'Offline Expedition'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">[PATROL]</span>
                </button>

                {/* Item 389: Tactician Mastery */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setIsTacticianMasteryOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/60 text-amber-200 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">👑</span>
                    <span>{language === 'ko' ? '전술가 마스터리 & 스킨' : 'Tactician Mastery'}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">[AURA]</span>
                </button>

                {/* Item 392: Tower of Trials */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setIsTowerTrialsOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-950/40 border border-indigo-800/40 hover:bg-indigo-900/60 text-indigo-200 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🗼</span>
                    <span>{language === 'ko' ? '시련의 탑 50층' : 'Tower of Trials'}</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono">[ASCENT]</span>
                </button>

                {/* Item 397: Secret Stamp Book */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setIsSecretStampModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/60 text-amber-200 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📜</span>
                    <span>{language === 'ko' ? '비밀 업적 스탬프북' : 'Secret Stamp Book'}</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">[STAMPS]</span>
                </button>

                {/* Item 393: Battle Gambit Tuning */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setIsGambitModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/60 text-blue-200 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚙️</span>
                    <span>{language === 'ko' ? '전술 지침(Gambit) 튜닝' : 'Gambit AI Tuning'}</span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono">[GAMBIT]</span>
                </button>

                {/* Post-Battle Detailed Summary (AI Combat Feedback) */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setShowPostBattleSummaryModal(true);
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-950/40 border border-indigo-500/40 hover:bg-indigo-900/60 text-indigo-200 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-indigo-400" />
                    <span>{language === 'ko' ? '📊 최근 AI 전투 사후 분석' : '📊 Post-Battle Summary'}</span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-mono">[STATS]</span>
                </button>

                {/* Element Advantage Quick Reference Guide */}
                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setShowElementAdvantageModal(true);
                  }}
                  className="w-full py-2.5 px-4 bg-cyan-950/40 border border-cyan-500/40 hover:bg-cyan-900/60 text-cyan-200 rounded-xl flex items-center justify-between font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-cyan-400" />
                    <span>{language === 'ko' ? '🛡️ 속성 상성표 퀵 가이드' : '🛡️ Element Advantage Guide'}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">[ELEM]</span>
                </button>

                <button
                  onClick={() => {
                    setShowInGameMenu(false);
                    setShowForfeitConfirm(true);
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className="w-full py-2.5 px-4 bg-red-950/40 border border-red-800/40 hover:bg-red-900/60 text-red-300 rounded-xl flex items-center gap-2 font-bold text-xs uppercase transition-all cursor-pointer"
                >
                  <ShieldAlert size={16} className="text-red-400" />
                  <span>{language === 'ko' ? '경기 포기 / 나가기' : 'Forfeit / Exit Match'}</span>
                </button>
              </div>

              <button
                onClick={() => setShowInGameMenu(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                {language === 'ko' ? '닫기' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Tactical Battle Log Modal / Panel */}
      <AnimatePresence>
        {showMobileLogs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[350] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pointer-events-auto font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900/95 border border-slate-700/80 backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] max-w-2xl w-full h-[80vh] max-h-[600px] flex flex-col overflow-hidden text-white border-amber-500/30"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-wider uppercase text-slate-100 flex items-center gap-2">
                      <span>{language === 'ko' ? '전투 상황 로그창' : 'TACTICAL BATTLE LOG'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                        {gameLogs.length} {language === 'ko' ? '건' : 'LOGS'}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {language === 'ko' ? '턴별 스킬 발동, 대미지 차이 및 카드 점령 상황 기록' : 'Turn-by-turn skill triggers, damage diffs, and card captures'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setGameLogs([]);
                      localStorage.removeItem('hero_game_logs');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer"
                  >
                    {language === 'ko' ? '로그 초기화' : 'Clear'}
                  </button>
                  <button
                    onClick={() => setShowMobileLogs(false)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Log List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-slate-950/40">
                {gameLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Activity size={32} className="opacity-40" />
                    <span className="text-xs font-bold uppercase">
                      {language === 'ko' ? '기록된 전투 로그가 없습니다.' : 'No battle logs recorded yet.'}
                    </span>
                  </div>
                ) : (
                  gameLogs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "p-3 rounded-2xl border text-xs leading-relaxed font-semibold transition-all shadow-md flex items-start gap-2.5",
                        log.type === 'capture' 
                          ? "bg-gradient-to-r from-red-950/60 to-rose-950/40 border-red-500/60 text-red-100 shadow-[0_0_12px_rgba(239,68,68,0.15)]" 
                          : log.type === 'system' 
                            ? "bg-gradient-to-r from-amber-950/60 to-yellow-950/40 border-amber-500/60 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.15)]" 
                            : log.type === 'victory'
                              ? "bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border-emerald-500/60 text-emerald-100"
                              : log.type === 'defeat'
                                ? "bg-gradient-to-r from-purple-950/60 to-indigo-950/40 border-purple-500/60 text-purple-100"
                                : "bg-slate-900/80 border-slate-800 text-slate-200"
                      )}
                    >
                      <span className="text-[10px] font-mono opacity-50 shrink-0 pt-0.5">
                        [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                      </span>
                      <div className="flex-1 break-words">
                        {log.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>SNSHero Battle Engine v4.2</span>
                <button
                  onClick={() => setShowMobileLogs(false)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md cursor-pointer"
                >
                  {language === 'ko' ? '닫기' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Overlays */}
      <div className="absolute left-2 md:left-4 top-[55%] md:top-[60%] -translate-y-1/2 flex flex-col gap-2 z-[60]">
      </div>

      {/* Primary Battle Arena Container: Dedicated Viewport Area for Opponent Hand, Center Board, Player Hand */}
      <div id="primary-battle-arena" className="w-full flex-1 flex flex-col justify-between items-center max-w-5xl mx-auto min-h-0 relative z-10 shrink-0 gap-1 sm:gap-1.5">
        {/* 1. 상대 덱/패 영역 (카드 높이에 맞춰 컴팩트 조정) */}
        <div id="opponent-hand-container" className={cn(
        "h-auto py-0.5 sm:py-1 md:py-1.5 relative flex items-center justify-center px-1 overflow-visible w-full bg-[#0f172a] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] border-2 box-border bg-clip-padding rounded-2xl shadow-sm shrink-0",
        turn === 'ai' && !gameOver ? "border-red-500/50 z-20" : "border-red-500/20 z-10"
      )}>
        
        {/* Item 357: Opponent 1-Line Slim Monospace Tag (Visible on Mobile & Desktop) & Item 34: Mute Toggle */}
        <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 bg-rose-950/90 text-rose-200 text-[8px] sm:text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm shadow-xs border border-rose-500/40 backdrop-blur-xs">
          <span className="text-rose-400 font-black">[OPP]</span>
          <span className="truncate max-w-[80px] sm:max-w-[120px] text-white">{lastOpponent?.name || 'ENEMY'}</span>
          <span className="text-slate-500">·</span>
          <span>TP {((lastOpponent?.type === 'user' ? (lastOpponent as any).totalPower : undefined) || opponentTotalPower || aiSimulatedTotalPower || 1200).toLocaleString()}</span>
          {lastOpponent?.sns !== undefined && lastOpponent.sns > 0 && (
            <>
              <span className="text-slate-500">·</span>
              <span className="text-amber-300">🪙{lastOpponent.sns.toLocaleString()}</span>
            </>
          )}
          <button
            type="button"
            onClick={handleToggleOpponentMute}
            className={cn(
              "ml-1 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs",
              isOpponentMuted
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            )}
            title={isOpponentMuted ? (language === 'ko' ? '상대 감정표현 차단 해제' : 'Unmute Opponent') : (language === 'ko' ? '상대 감정표현 차단' : 'Mute Opponent')}
          >
            {isOpponentMuted ? <VolumeX size={10} className="text-white" /> : <Volume2 size={10} className="text-slate-300" />}
            <span>{isOpponentMuted ? (language === 'ko' ? '차단됨' : 'Muted') : (language === 'ko' ? '음소거' : 'Mute')}</span>
          </button>
        </div>
        
        <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-1 md:gap-2 h-auto my-auto relative z-10 py-0.5">
          <AnimatePresence mode="popLayout">
            {opponentHand.map((card, idx) => {
              const isSelected = selectedCardIdx === idx && selectedCardSide === 'ai';
              
              return (
              <motion.div 
                key={card.id} 
                className={cn(
                  "w-[16vw] max-w-[58px] sm:max-w-[68px] md:max-w-[80px] lg:max-w-[88px] aspect-[5/7] cursor-pointer flex-shrink-0 relative mx-0.5 md:mx-1 rounded-lg",
                  isSelected && "z-50"
                )}
                onClick={() => handleCardClick(idx, 'ai')}
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ 
                  y: isSelected ? 20 : 0,
                  scale: isSelected ? 1.08 : 1,
                  opacity: 1
                }}
                exit={{ opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.15 } }}
                transition={{ duration: 0.15 }}
                whileHover={{
                  y: isSelected ? 28 : 10,
                  scale: isSelected ? 1.1 : 1.05
                }}
              >
                <CardItem 
                  card={card} 
                  isLocked={!isShadowMatch || turn !== 'ai'} 
                  isSelected={selectedCardIdx === idx && selectedCardSide === 'ai'}
                  className="w-full h-full rounded-lg"
                  customImage={customCardImage}
                  lowSpecMode={lowSpecMode}
                  isMatgo={false}
                />
              </motion.div>
            )})}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. 가운데 카드판 영역 (유연하게 공간 확장) */}
      <div className="flex-1 flex flex-col items-center justify-center p-0.5 sm:p-1 md:p-1.5 bg-[#060a14] relative overflow-visible py-1.5 sm:py-2 md:py-2.5 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] border border-slate-800 rounded-2xl md:rounded-3xl mx-1 md:mx-2 my-0.5 shrink-0">
        {/* Background layers */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/topography.png')] opacity-[0.06]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        </div>
        {isPlayground && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 to-amber-600 border border-amber-400 text-white font-black px-4 py-1 rounded-full text-[10px] md:text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(220,38,38,0.4)] animate-pulse">
            {t('playground', language).toUpperCase()} MATCH (NO RECORD / NO REWARD)
          </div>
        )}
        {isGuildAttack && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-rose-600 to-indigo-600 border border-rose-400 text-white font-black px-4 py-1 rounded-full text-[10px] md:text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(225,29,72,0.4)] animate-pulse">
            {t('guild_attack_battle_banner', language).toUpperCase()}
          </div>
        )}
        {isPvpBoardAttack && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 to-rose-600 border border-red-400 text-white font-black px-4 py-1 rounded-full text-[10px] md:text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(239,68,68,0.4)] animate-pulse">
            {t('pvp_board_attack_banner', language).toUpperCase()}
          </div>
        )}
        {/* Auto Battle Background Watermark */}
        {isAutoBattle && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-[-1] overflow-hidden select-none">
            <motion.div 
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 0.05, scale: 1 }}
              className="text-[12vw] font-black italic text-black uppercase tracking-[0.5em] whitespace-nowrap rotate-[-15deg]"
            >
              {t('auto_battle_sys_running', language).split('.')[0]}
            </motion.div>
          </div>
        )}

        {/* Animated Cyber Grid Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          <motion.div 
            animate={{ 
              x: [0, 40], 
              y: [0, 40] 
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:40px_40px] opacity-15"
          />
        </div>

        {/* Item 349 & 361: TOP COMPACT 1-LINE SCORE & 9-ROUND LED MICRO-DOT STATUS BAR */}
        {!gameOver && gameState === 'playing' && (
          <div className="flex flex-wrap items-center justify-between w-full max-w-sm sm:max-w-md px-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-sm shadow-md text-xs font-mono font-bold z-20 mb-1 backdrop-blur-md gap-2">
            {/* Player Score */}
            <div className="flex items-center gap-1.5 text-indigo-400">
              <span className="text-[10px] text-slate-400">[YOU]</span>
              <span className="px-1.5 py-0.5 rounded-sm bg-indigo-950/80 border border-indigo-500/50 font-black text-indigo-300 text-xs">
                {battleType === 'matgo' ? matgoScores.player : boardScore.player}
              </span>
            </div>

            {/* 1-Line Turn Status + Turn Countdown Timer + 9-Turn LED Micro-Dots */}
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "px-2 py-0.5 rounded-sm text-[10px] uppercase font-mono font-black flex items-center gap-1 border",
                turn === 'player'
                  ? "bg-indigo-950/80 border-indigo-500/70 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                  : "bg-rose-950/80 border-rose-500/70 text-rose-300"
              )}>
                {turn === 'player' ? (
                  <><Zap size={11} className="text-yellow-400 animate-pulse" /> [ YOUR TURN ]</>
                ) : (
                  <><Cpu size={11} className="text-rose-400 animate-spin" /> [ ENEMY TURN ]</>
                )}
              </div>

              {/* Turn Countdown Timer SVG (Row 26) */}
              <div
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-mono text-[9px] font-bold border transition-all",
                  turnTimerSeconds <= 5
                    ? "bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]"
                    : "bg-slate-900 border-slate-700/70 text-slate-300"
                )}
                title={language === 'ko' ? `남은 턴 시간: ${turnTimerSeconds}초` : `Turn Time: ${turnTimerSeconds}s`}
              >
                <div className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 -rotate-90" viewBox="0 0 20 20">
                    <circle
                      cx="10"
                      cy="10"
                      r="7.5"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="7.5"
                      fill="none"
                      stroke={turnTimerSeconds <= 5 ? "#f43f5e" : turn === 'player' ? "#6366f1" : "#f59e0b"}
                      strokeWidth="2.5"
                      strokeDasharray={47.12}
                      strokeDashoffset={47.12 * (1 - turnTimerSeconds / turnMaxSeconds)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                </div>
                <span className={cn("font-black tracking-tighter", turnTimerSeconds <= 5 ? "text-rose-400 font-extrabold" : "text-slate-200")}>
                  {turnTimerSeconds}s
                </span>
              </div>

              {/* Item 351: Sudden Death Overclock Badge */}
              {isSuddenDeathOverclock && (
                <span className="px-1.5 py-0.5 rounded-sm bg-amber-950/80 border border-amber-500/70 text-amber-300 text-[9px] font-mono font-bold animate-pulse">
                  [ ⚡ OVERCLOCK +2 ]
                </span>
              )}

              {/* Item 361: 9-Turn LED Micro-Dots (Shows filled player/enemy slots & remaining turns) */}
              {battleType !== 'matgo' && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-slate-900 border border-slate-800" title={`Round Progress: ${board.filter(c => c !== null).length}/9 Turns`}>
                  {board.map((cell, idx) => {
                    const isPlayer = cell?.owner === 'player';
                    const isAi = cell?.owner === 'ai';
                    return (
                      <span
                        key={idx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all duration-300",
                          isPlayer ? "bg-indigo-400 shadow-[0_0_4px_rgba(99,102,241,0.8)] scale-110" :
                          isAi ? "bg-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.8)] scale-110" :
                          "bg-slate-700/60"
                        )}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Opponent Score */}
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="px-1.5 py-0.5 rounded-sm bg-rose-950/80 border border-rose-500/50 font-black text-rose-300 text-xs">
                {battleType === 'matgo' ? matgoScores.ai : boardScore.ai}
              </span>
              <span className="text-[10px] text-slate-400">[ENEMY]</span>
            </div>
          </div>
        )}

        {/* Main Board Area with Turn Indicator and Score flanking it */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-6xl md:px-2 min-h-0 gap-1 md:gap-2 mt-0.5">
          

          <div className="relative flex items-center justify-center w-full min-h-[280px] sm:min-h-[320px] md:min-h-[350px] gap-2 md:gap-4 lg:gap-6 xl:gap-8">
            {/* DESKTOP LEFT SIDEBAR: VERTICAL TURN INDICATOR (lg:flex ONLY) */}
            {!gameOver && gameState === 'playing' && (
              <div className="hidden lg:flex flex-col items-center justify-center shrink-0 z-20 pointer-events-none select-none">
                {/* 1. VERTICAL TURN INDICATOR */}
                {!isCoinFlipping && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={turn}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className={cn(
                      "w-auto px-2 md:px-3 py-4 md:py-6 rounded-full border font-bold uppercase text-[8px] md:text-xs tracking-[0.2em] shadow-lg transition-all flex flex-col items-center gap-2 md:gap-4 [writing-mode:vertical-lr]",
                      turn === 'player' 
                        ? "bg-gradient-to-b from-indigo-600 to-indigo-900 border-indigo-400/40 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse" 
                        : "bg-gradient-to-b from-rose-600 to-rose-900 border-rose-400/40 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse"
                    )}>
                      {turn === 'player' ? (
                        <div className="flex items-center gap-2 md:gap-4">
                          <Zap size={12} className="md:w-4 md:h-4 animate-pulse text-yellow-350" />
                          <span>{t('your_turn', language)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 md:gap-4">
                          <Cpu size={12} className="md:w-4 md:h-4 animate-spin text-red-350" />
                          <span>{t('opponent_turn', language)}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

          <div className={cn(
            "relative p-1 md:p-2 border-4 rounded-3xl bg-[#090d16]/90 border-slate-800 transition-all duration-300 shrink-0",
            !isLowPerformance && "shadow-[0_0_50px_rgba(0,0,0,0.8)]",
            isFeverMode && "border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.6)] animate-pulse",
            isMicroShaking && "translate-x-[2px] translate-y-[-2px]",
            !gameOver && gameState === 'playing' && !isFeverMode ? (
              turn === 'player' 
                ? (isLowPerformance ? "border-blue-500" : "border-blue-500/50 shadow-[0_0_60px_rgba(59,130,246,0.25)] scale-[1.01]")
                : (isLowPerformance ? "border-red-500" : "border-red-500/50 shadow-[0_0_60px_rgba(239,68,68,0.25)] scale-[1.01]")
            ) : (!isFeverMode && "border-slate-700 shadow-2xl")
          )}>
            {/* Item 386: Cross Domination 4-Way Capture Shockwave Overlay */}
            <AnimatePresence>
              {isCrossDominationActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1.05 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="absolute inset-0 z-[250] flex flex-col items-center justify-center bg-amber-500/20 backdrop-blur-xs pointer-events-none rounded-3xl"
                >
                  <div className="bg-black/85 border border-amber-400 px-4 py-2 rounded-sm text-center shadow-2xl">
                    <span className="text-lg md:text-2xl font-black text-amber-300 font-mono block">
                      ✨ [ CROSS DOMINATION ]
                    </span>
                    <span className="text-xs text-white font-mono">
                      {language === 'ko' ? '4방향 동시 십자 격파!' : '4-Way Simultaneous Shockwave!'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Item 382: Total Eclipse Domination 9:0 Full Board Black Hole Vortex */}
            <AnimatePresence>
              {isTotalEclipseWin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-[260] flex flex-col items-center justify-center bg-black/90 pointer-events-none rounded-3xl"
                >
                  <div className="text-center p-4">
                    <span className="text-4xl md:text-6xl animate-spin block mb-2">🌑</span>
                    <span className="text-lg md:text-2xl font-black text-purple-400 font-mono tracking-widest block">
                      [ TOTAL ECLIPSE DOMINATION ]
                    </span>
                    <span className="text-xs text-purple-200 font-mono">
                      {language === 'ko' ? '9:0 전장 100% 완전 장악!' : '100% Full Board Clean Sweep!'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Floating Combo Text */}
            <AnimatePresence>
              {lastCombo && (Date.now() - lastCombo.timestamp < 1500) && (
                <motion.div
                  key={lastCombo.timestamp}
                  initial={{ scale: 0.5, opacity: 0, y: 20 }}
                  animate={{ scale: [1, 1.5, 1.2], opacity: 1, y: -40 }}
                  exit={{ opacity: 0, scale: 2, y: -100 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none select-none"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-4xl md:text-7xl font-black italic text-transparent bg-clip-text bg-[linear-gradient(to_bottom,#ef4444,#f59e0b)] drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] leading-none whitespace-nowrap">
                      X{lastCombo.count} COMBO!
                    </span>
                    <span className="text-xl md:text-3xl font-black text-white italic uppercase tracking-[0.2em] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] whitespace-nowrap">
                      {t('combo_chain', language) || (language === 'ko' ? "콤보체인!" : "CHAIN FLIP!")}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tactical Game Log Removed from here */}

            {/* Mobile Log Message (Overlay) */}
            {gameLogs.length > 0 && (
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[90%] lg:hidden z-[70] pointer-events-none">
                 <AnimatePresence mode="wait">
                    <motion.div
                      key={gameLogs[0].id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "px-3.5 py-2 rounded-full border bg-slate-900/95 border-slate-850 shadow-lg text-[9.5px] font-bold uppercase text-center truncate tracking-wider",
                        gameLogs[0].type === 'capture' ? "text-rose-400 border-rose-900/50" : 
                        gameLogs[0].type === 'system' ? "text-amber-400 border-amber-900/50" :
                        "text-slate-300"
                      )}
                    >
                      {gameLogs[0].text}
                    </motion.div>
                 </AnimatePresence>
              </div>
            )}



            {/* Matgo Middle Card Draw Overlay */}
            <AnimatePresence>
              {battleType === 'matgo' && isShowingMatgoMiddle && matgoMiddleCard && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                  <div className="bg-slate-900/95 border border-amber-500 rounded-3xl p-6 flex flex-col items-center gap-4 max-w-[280px] w-full shadow-2xl animate-pulse">
                    <span className="text-xs font-black text-amber-400 tracking-widest uppercase">
                      {t('matgo_middle_draw', language) || (language === 'ko' ? '가운데 카드 뒤집기' : 'DRAWING MIDDLE CARD')}
                    </span>
                    <div className="w-[120px] aspect-[5/7] rounded-xl overflow-hidden shadow-2xl border-2 border-amber-500">
                      <CardItem
                        card={matgoMiddleCard}
                        isLocked={true}
                        isOnBoard={true}
                        lowSpecMode={lowSpecMode}
                        isMatgo={battleType === 'matgo'}
                        className="w-full h-full"
                      />
                    </div>
                    <span className="text-sm font-black text-white text-center">
                      {language === 'ko' 
                        ? `${matgoMiddleCard.title} (${getNormalizedElement(matgoMiddleCard)})` 
                        : `${matgoMiddleCard.title_en} (${getNormalizedElement(matgoMiddleCard)})`}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={cn(
              "flex flex-col-reverse md:flex-row-reverse items-center justify-center gap-4 md:gap-12 relative animate-in fade-in duration-700",
              isClutchSlowMo && "scale-[1.02] filter contrast-125 transition-transform duration-300"
            )}>
                    <div className={cn(
                      "grid grid-cols-3 gap-1 md:gap-2 w-fit relative p-1.5 rounded-sm transition-all",
                      isSuddenDeathOverclock && "border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-amber-950/10"
                    )}>
                      {/* Item 394 & Item 402: Battle Combo Announcer & Critical Shatter Overlay */}
                      {comboAnnounceData && (
                        <BattleComboAnnouncer
                          comboType={comboAnnounceData.comboType}
                          comboCount={comboAnnounceData.comboCount}
                          isCriticalShatter={comboAnnounceData.isCriticalShatter}
                          maxPowerDiff={comboAnnounceData.maxPowerDiff}
                        />
                      )}

                      {/* Item 365: 1px Perimeter Ring Timer (BattleTurnRing) */}
                      <div className="absolute inset-0 pointer-events-none rounded-sm border border-slate-700/60 overflow-hidden z-[100]">
                        <div
                          className={cn(
                            "absolute inset-0 border transition-all duration-300 pointer-events-none",
                            turn === 'player'
                              ? "border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                              : "border-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.35)]"
                          )}
                        />
                      </div>

                      {/* Shockwave Overlay */}
                      {customWaveEffect && (
                        <div className="absolute inset-0 pointer-events-none z-[200] flex items-center justify-center overflow-hidden rounded-xl">
                           <div className={cn(
                            "absolute w-12 h-12 rounded-full border-8 animate-roar-ripple",
                            customWaveEffect === 'red' && "border-red-500 bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.8)]",
                            customWaveEffect === 'blue' && "border-blue-500 bg-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.8)]",
                            customWaveEffect === 'yellow' && "border-yellow-500 bg-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.8)]",
                            customWaveEffect === 'purple' && "border-purple-500 bg-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.8)]"
                          )} />
                          <motion.div
                            initial={{ scale: 0.1, opacity: 0 }}
                            animate={{ scale: [0.5, 2.5, 0], opacity: [0, 1, 1, 0] }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={cn(
                              "absolute z-[210] p-4 rounded-full border-2 bg-black/80 backdrop-blur-md shadow-2xl flex items-center justify-center",
                              customWaveEffect === 'red' && "border-red-500 text-red-500",
                              customWaveEffect === 'blue' && "border-blue-500 text-blue-500",
                              customWaveEffect === 'yellow' && "border-yellow-500 text-yellow-500",
                              customWaveEffect === 'purple' && "border-purple-500 text-purple-500"
                            )}
                          >
                            {customWaveEffect === 'red' && <Flame size={40} className="animate-bounce" />}
                            {customWaveEffect === 'blue' && <Droplets size={40} className="animate-pulse" />}
                            {customWaveEffect === 'yellow' && <Sparkles size={40} className="animate-pulse" />}
                            {customWaveEffect === 'purple' && <ShieldAlert size={40} className="animate-pulse" />}
                          </motion.div>
                        </div>
                      )}

                      {/* Item 74: Stat Comparison Lightning Pulse & Item 363: Mana Circuit FX Overlay */}
                      <svg className="absolute inset-0 z-[180] w-full h-full pointer-events-none overflow-visible">
                        <defs>
                          <linearGradient id="lightningPulseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
                          </linearGradient>
                          <filter id="lightningGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                        {/* Item 363: 3-Tile Mana Circuit Lines */}
                        {activeManaCircuits.map((circuit, cIdx) => {
                          const [a, , c] = circuit.line;
                          const ax = `${((a % 3) + 0.5) * 33.333}%`;
                          const ay = `${(Math.floor(a / 3) + 0.5) * 33.333}%`;
                          const cx = `${((c % 3) + 0.5) * 33.333}%`;
                          const cy = `${(Math.floor(c / 3) + 0.5) * 33.333}%`;
                          const isPl = circuit.owner === 'player';
                          return (
                            <g key={`mana-circuit-${cIdx}`}>
                              <line
                                x1={ax}
                                y1={ay}
                                x2={cx}
                                y2={cy}
                                stroke={isPl ? "#06b6d4" : "#ec4899"}
                                strokeWidth="4"
                                strokeLinecap="round"
                                className="animate-pulse opacity-90 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                              />
                              <line
                                x1={ax}
                                y1={ay}
                                x2={cx}
                                y2={cy}
                                stroke="#ffffff"
                                strokeWidth="1.5"
                                strokeDasharray="4 4"
                                strokeLinecap="round"
                                className="animate-ping opacity-75"
                              />
                            </g>
                          );
                        })}
                        {Object.entries(combatHighlights).map(([srcIdxStr, dirs]) => {
                          const srcIdx = Number(srcIdxStr);
                          const srcRow = Math.floor(srcIdx / 3);
                          const srcCol = srcIdx % 3;
                          const x1 = `${(srcCol + 0.5) * 33.333}%`;
                          const y1 = `${(srcRow + 0.5) * 33.333}%`;

                          return (dirs as number[]).map((dir, dIdx) => {
                            let tgtIdx = -1;
                            if (dir === 0 && srcRow > 0) tgtIdx = srcIdx - 3;
                            else if (dir === 1 && srcCol < 2) tgtIdx = srcIdx + 1;
                            else if (dir === 2 && srcRow < 2) tgtIdx = srcIdx + 3;
                            else if (dir === 3 && srcCol > 0) tgtIdx = srcIdx - 1;

                            if (tgtIdx < 0) return null;

                            const tgtRow = Math.floor(tgtIdx / 3);
                            const tgtCol = tgtIdx % 3;
                            const x2 = `${(tgtCol + 0.5) * 33.333}%`;
                            const y2 = `${(tgtRow + 0.5) * 33.333}%`;

                            return (
                              <g key={`combat-hl-${srcIdx}-${tgtIdx}-${dir}-${dIdx}`}>
                                <line
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke="url(#lightningPulseGrad)"
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  filter="url(#lightningGlow)"
                                  className="animate-pulse"
                                />
                                <line
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  strokeDasharray="6 3"
                                  strokeLinecap="round"
                                  className="animate-ping opacity-80"
                                />
                              </g>
                            );
                          });
                        })}
                      </svg>
                      {board.map((card, idx) => {
                        if (battleType === 'matgo' && idx === 4) {
                          return (
                            <div
                              key={idx}
                              className="grid-cell w-[16vw] max-w-[58px] sm:max-w-[68px] md:max-w-[80px] lg:max-w-[88px] aspect-[5/7] flex items-center justify-center relative border border-amber-500 bg-amber-950/20 rounded-lg shadow-md overflow-visible cursor-default"
                            >
                              <div className="absolute inset-0 p-0.5 rounded-lg overflow-hidden flex items-center justify-center bg-[#1e293b]/70 border border-slate-700">
                                <img
                                  src={getAssetUrl('/background-gold.png')}
                                  alt="Matgo Deck"
                                  className="w-full h-full object-cover rounded"
                                />
                                {matgoDeck.length > 0 && (
                                  <div className="absolute bottom-1 right-1 bg-black/80 text-amber-400 border border-amber-500/50 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                                    {matgoDeck.length}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        const imgIdx = card?.imageIndex !== undefined ? card.imageIndex : undefined;
                        const processedImageForCell = (card as any)?.processedImage;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleCellClick(idx)}
                            onMouseEnter={() => handleMouseEnterCell(idx)}
                            onMouseLeave={handleMouseLeaveCell}
                            className={cn(
                              "grid-cell group w-[16vw] max-w-[58px] sm:max-w-[68px] md:max-w-[80px] lg:max-w-[88px] aspect-[5/7] flex items-center justify-center relative transition-all overflow-visible rounded-lg font-mono shadow-none [transform:translate3d(0,0,0)] [will-change:transform,opacity]",
                              card ? (
                                selectedCardIdx !== null && selectedCardSide === 'player' && turn === 'player'
                                  ? "border border-rose-500/40 opacity-75 saturate-75 cursor-not-allowed"
                                  : "border border-slate-750/70 cursor-pointer"
                              ) : (
                                idx === goblinTileIndex && !goblinCaptured
                                  ? "border-2 border-yellow-400 bg-yellow-950/40 shadow-[0_0_12px_rgba(234,179,8,0.5)] animate-pulse cursor-pointer"
                                  : idx === manaSpringTileIndex && !manaSpringClaimed
                                    ? "border-2 border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(34,211,238,0.5)] animate-pulse cursor-pointer"
                                    : "border border-dashed border-slate-700/60 bg-slate-950/40 hover:border-solid hover:border-cyan-400 hover:bg-cyan-950/20 cursor-pointer"
                              ),
                              !card && boardTraps[idx] === 'purple' && "bg-purple-800/40 border-purple-400 border-2",
                              !card && boardTraps[idx] === 'red' && "bg-red-800/40 border-red-400 border-2",
                              !card && selectedCardIdx !== null && selectedCardSide === 'player' && turn === 'player' && "border-2 border-emerald-400 bg-emerald-950/50 shadow-[0_0_16px_rgba(52,211,153,0.6)] animate-pulse",
                              !card && aiReasoning?.boardIdx === idx && turn === 'ai' && "border-solid border-rose-500 bg-rose-950/30",
                              !card && selectedCardIdx !== null && selectedCardSide === 'player' && recommendedPlayerMove?.cardIdx === selectedCardIdx && recommendedPlayerMove?.boardIdx === idx && turn === 'player' && "border-2 border-cyan-300 bg-cyan-900/50 shadow-[0_0_18px_rgba(34,211,238,0.8)]"
                            )}
                          >
                            {/* Row 78: Invalid Drop Target Overlay on Occupied Slots */}
                            {card && selectedCardIdx !== null && selectedCardSide === 'player' && turn === 'player' && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-black/25 rounded-lg">
                                <span className="text-[7px] font-mono font-bold text-rose-300/90 bg-rose-950/80 px-1 py-0.2 rounded-xs border border-rose-500/40 shadow-xs">
                                  {language === 'ko' ? '점유됨' : 'OCCUPIED'}
                                </span>
                              </div>
                            )}

                            {/* Row 62: Valid Drop Target Indicator when player card selected */}
                            {!card && selectedCardIdx !== null && selectedCardSide === 'player' && turn === 'player' && (
                              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
                                <div className="w-5 h-5 rounded-full border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center animate-ping" />
                                <span className="text-[7px] font-mono font-black text-emerald-300 bg-black/85 px-1 py-0.2 rounded-xs border border-emerald-400/60 mt-1 uppercase whitespace-nowrap shadow-sm">
                                  {language === 'ko' ? '[배치]' : '[PLACE]'}
                                </span>
                              </div>
                            )}
                            {/* Item 347: Goblin Spawn Badge in Grid Cell */}
                            {!card && idx === goblinTileIndex && !goblinCaptured && (
                              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
                                <Coins size={22} className="text-yellow-400 animate-bounce drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                                <span className="text-[8px] font-mono font-black text-yellow-300 bg-black/80 px-1 py-0.5 rounded-sm border border-yellow-400/60 mt-1 whitespace-nowrap">
                                  [🪙 +25 SNS]
                                </span>
                              </div>
                            )}
                            {/* Item 355: Mana Spring Badge in Grid Cell */}
                            {!card && idx === manaSpringTileIndex && !manaSpringClaimed && (
                              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
                                <Sparkles size={22} className="text-cyan-400 animate-spin drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                <span className="text-[8px] font-mono font-black text-cyan-300 bg-black/80 px-1 py-0.5 rounded-sm border border-cyan-400/60 mt-1 whitespace-nowrap">
                                  [💧 +2 STATS]
                                </span>
                              </div>
                            )}
                            {/* Item 375: Rage Spark Slot Badge in Grid Cell */}
                            {!card && idx === rageSparkSlotIndex && (
                              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-1 pointer-events-none">
                                <Flame size={22} className="text-red-400 animate-bounce drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                <span className="text-[8px] font-mono font-black text-red-300 bg-black/80 px-1 py-0.5 rounded-sm border border-red-400/60 mt-1 whitespace-nowrap">
                                  [🔥 +3 RAGE]
                                </span>
                              </div>
                            )}
                            {/* Item 367: Poison Swamp Hazard Badge in Grid Cell */}
                            {idx === poisonSwampTileIndex && (
                              <div className="absolute top-1 right-1 z-20 flex items-center gap-1 pointer-events-none">
                                {poisonSwampCleansed ? (
                                  <span className="text-[8px] font-mono font-black text-emerald-300 bg-emerald-950/90 border border-emerald-400/70 px-1 py-0.5 rounded-sm shadow-md">
                                    [🌿 정화 +1]
                                  </span>
                                ) : !card ? (
                                  <span className="text-[8px] font-mono font-black text-rose-300 bg-rose-950/90 border border-rose-400/70 px-1 py-0.5 rounded-sm shadow-md animate-pulse">
                                    [☣️ 독기 -1]
                                  </span>
                                ) : null}
                              </div>
                            )}
                            {/* Elemental Tile Background */}
                            {!card && elementalBoard[idx] && (
                              <div className={cn(
                                "absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br rounded-lg shadow-sm border",
                                elementalBoard[idx] === 'water' ? "from-blue-600/35 to-cyan-500/35 border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.3)]" :
                                elementalBoard[idx] === 'fire' ? "from-red-600/35 to-orange-500/35 border-red-400/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]" :
                                elementalBoard[idx] === 'wind' || elementalBoard[idx] === 'air' ? "from-emerald-500/35 to-teal-400/35 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]" :
                                elementalBoard[idx] === 'land' || elementalBoard[idx] === 'earth' ? "from-amber-700/35 to-orange-900/35 border-amber-500/50 shadow-[0_0_12px_rgba(180,83,9,0.3)]" :
                                elementalBoard[idx] === 'human' ? "from-sky-400/35 to-indigo-400/35 border-sky-300/50 shadow-[0_0_12px_rgba(56,189,248,0.3)]" :
                                elementalBoard[idx] === 'undead' ? "from-purple-900/40 to-fuchsia-950/40 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]" :
                                elementalBoard[idx] === 'elf' ? "from-green-600/35 to-emerald-600/35 border-green-400/50 shadow-[0_0_12px_rgba(34,197,94,0.3)]" :
                                elementalBoard[idx] === 'dwarf' ? "from-zinc-650/40 to-slate-700/40 border-zinc-500/50 shadow-[0_0_12px_rgba(113,113,122,0.3)]" :
                                elementalBoard[idx] === 'monster' ? "from-orange-600/35 to-red-500/35 border-orange-400/50 shadow-[0_0_12px_rgba(249,115,22,0.3)]" :
                                elementalBoard[idx] === 'robot' ? "from-slate-500/35 to-zinc-600/35 border-slate-400/50 shadow-[0_0_12px_rgba(100,116,139,0.3)]" :
                                elementalBoard[idx] === 'dragon' ? "from-rose-700/35 to-red-800/35 border-rose-500/50 shadow-[0_0_12px_rgba(225,29,72,0.3)]" :
                                "from-slate-400/30 to-slate-300/30 border-slate-350/50"
                              )}>
                                <div className="flex items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] opacity-75">
                                  {elementalBoard[idx] === 'water' && <Waves size={30} className="text-blue-200/80" />}
                                  {elementalBoard[idx] === 'fire' && <Flame size={30} className="text-red-200/80" />}
                                  {(elementalBoard[idx] === 'wind' || elementalBoard[idx] === 'air') && <Wind size={30} className="text-emerald-200/80" />}
                                  {(elementalBoard[idx] === 'land' || elementalBoard[idx] === 'earth') && <Mountain size={30} className="text-amber-200/80" />}
                                  {elementalBoard[idx] === 'human' && <User size={30} className="text-sky-200/80" />}
                                  {elementalBoard[idx] === 'undead' && <Skull size={30} className="text-purple-200/80" />}
                                  {elementalBoard[idx] === 'elf' && <Leaf size={30} className="text-green-200/80" />}
                                  {elementalBoard[idx] === 'dwarf' && <Hammer size={30} className="text-zinc-200/80" />}
                                  {elementalBoard[idx] === 'monster' && <Ghost size={30} className="text-orange-200/80" />}
                                  {elementalBoard[idx] === 'robot' && <Bot size={30} className="text-slate-200/80" />}
                                  {elementalBoard[idx] === 'dragon' && <Zap size={30} className="text-rose-200/80" />}
                                </div>

                                {/* Terrain Bonus Tooltip Badge on Hover */}
                                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-[150] opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap bg-slate-900/95 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-2 py-0.5 rounded shadow-xl backdrop-blur-xs">
                                  {language === 'ko' 
                                    ? `${elementalBoard[idx].toUpperCase()} 속성 +2 PWR` 
                                    : `${elementalBoard[idx].toUpperCase()} +2 PWR`}
                                </div>
                              </div>
                            )}
                            {/* Live Battle Calculation Preview Overlay (Item 70) */}
                            {hoveredCellIdx === idx && selectedCardIdx !== null && !card && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-[160] pointer-events-none whitespace-nowrap bg-indigo-950/95 text-amber-300 border border-amber-400 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full shadow-2xl animate-bounce">
                                ⚡ {capturePreview.length > 0 
                                  ? (language === 'ko' ? `미리보기: ${capturePreview.length}장 캡처!` : `PREVIEW: FLIP +${capturePreview.length}`) 
                                  : (language === 'ko' ? '카드 배치 가능' : 'PLACE CARD')}
                              </div>
                            )}

                            {/* Invalid Drop Target Shading / Prohibition Overlay (ID 78) */}
                            {card && selectedCardIdx !== null && selectedCardSide === 'player' && (
                              <div className="absolute inset-0 z-[140] bg-red-950/90 border-2 border-red-500 rounded-lg flex flex-col items-center justify-center text-red-400 font-mono text-[9px] font-black cursor-not-allowed pointer-events-none shadow-inner">
                                <XCircle size={20} className="text-red-500 animate-pulse mb-0.5" />
                                <span className="uppercase tracking-tighter">[X] {language === 'ko' ? '배치 불가' : 'OCCUPIED'}</span>
                              </div>
                            )}
                            {capturePreview.includes(idx) && (
                              <div className="absolute inset-0 z-[120] pointer-events-none rounded-lg flex flex-col items-center justify-center">
                                <div className="absolute inset-0 border-4 border-amber-400 animate-pulse rounded-lg bg-amber-500/30" />
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: [0.8, 1.1, 1] }}
                                  className="relative z-10 flex flex-col items-center bg-slate-900/95 text-amber-300 border border-amber-400 px-2 py-0.5 rounded-md shadow-xl"
                                >
                                  <Swords size={18} className="text-amber-400 animate-bounce" />
                                  <span className="text-[8px] font-mono font-extrabold text-amber-300 whitespace-nowrap">
                                    {language === 'ko' ? '뒤집힘 예상' : 'FLIP TARGET'}
                                  </span>
                                </motion.div>
                              </div>
                            )}
                            {/* AI Targeting Icon */}
                            {!card && turn === 'ai' && aiReasoning?.boardIdx === idx && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 0.8, scale: 1 }}
                                className="absolute inset-0 z-[120] flex items-center justify-center pointer-events-none"
                              >
                                <TargetIcon size={32} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                              </motion.div>
                            )}
                            {/* Recommended Targeting Icon */}
                            {!card && turn === 'player' && selectedCardIdx !== null && selectedCardSide === 'player' && recommendedPlayerMove?.cardIdx === selectedCardIdx && recommendedPlayerMove?.boardIdx === idx && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 0.9, scale: 1 }}
                                className="absolute inset-0 z-[120] flex items-center justify-center pointer-events-none"
                              >
                                <TargetIcon size={32} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                              </motion.div>
                            )}
                            {/* AI & Recommended Reasoning Tooltip */}
                            <AnimatePresence>
                              {(aiReasoning && aiReasoning.boardIdx === idx && turn === 'ai') || 
                               (!card && turn === 'player' && selectedCardIdx !== null && selectedCardSide === 'player' && recommendedPlayerMove?.cardIdx === selectedCardIdx && recommendedPlayerMove?.boardIdx === idx) ? (() => {
                                const isAi = turn === 'ai' && aiReasoning && aiReasoning.boardIdx === idx;
                                const textStr = isAi ? aiReasoning.text : recommendedPlayerMove?.reason || "";
                                const isPl = isAi ? aiReasoning.isPlayer : true;
            
                                return (
                                  <motion.div
                                    key={`tooltip-${idx}`}
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: -40, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="absolute left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
                                  >
                                    <div className={cn(
                                      "whitespace-nowrap px-3 py-1.5 rounded-lg border-2 shadow-xl text-[10px] md:text-xs font-black italic uppercase tracking-wider flex items-center gap-2",
                                      isPl ? "bg-blue-600 border-blue-400 text-white" : "bg-red-600 border-red-400 text-white"
                                    )}>
                                      {isPl ? <Sparkles size={12} className="animate-pulse" /> : <Cpu size={12} className="animate-spin-slow" />}
                                      {t(textStr as any, language)}
                                      <div className={cn(
                                        "absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r-2 border-b-2",
                                        isPl ? "bg-blue-600 border-blue-400" : "bg-red-600 border-red-400"
                                      )} />
                                    </div>
                                  </motion.div>
                                );
                              })() : null}
                            </AnimatePresence>
            
                            {/* Evaluation Highlight */}
                            {checkingIdx === idx && (
                              <div className="absolute inset-0 z-[150] pointer-events-none rounded-lg flex items-center justify-center bg-white/30 border-4 border-yellow-400 animate-pulse">
                                <Search size={32} className="text-yellow-500 drop-shadow-md" />
                              </div>
                            )}
            
                            <AnimatePresence mode="popLayout">
                              {card ? (
                                <motion.div
                                  key={`${card.id}`}
                                  initial={{ 
                                    scale: 0.8, 
                                    opacity: 0
                                  }}
                                  animate={{ 
                                    scale: 1,
                                    opacity: 1,
                                    x: lastPlacedIdx === idx ? [0, -6, 6, -6, 6, 0] : 0,
                                    zIndex: 20
                                  }}
                                  transition={{
                                    scale: { duration: 0.15 },
                                    opacity: { duration: 0.15 },
                                    x: { duration: 0.3 }
                                  }}
                                  className={cn("absolute inset-0", isRoarActive && "roar-flame-active")}
                                >
                                  <CardItem 
                                    card={card} 
                                    isLocked={true} 
                                    isOnBoard={true}
                                    isDamaged={Boolean(damagedCells[idx])}
                                    className={cn(
                                      "w-full h-full z-10 rounded-lg", 
                                      isRoarActive && "text-fire-active",
                                      fireGlowCells instanceof Set && fireGlowCells.has(idx) && "fire-glow-card",
                                      waterGlowCells instanceof Set && waterGlowCells.has(idx) && "water-glow-card"
                                    )}
                                    customImage={customCardImage}
                                    processedImage={processedImageForCell}
                                    combatHighlights={combatHighlights[idx]}
                                    lowSpecMode={lowSpecMode}
                                    cellElement={elementalBoard[idx]}
                                    isMatgo={false}
                                  />
                                  {/* Floating Stat Change FX Overlay (Item 38) */}
                                  <AnimatePresence>
                                    {floatingStatFX[idx] && (
                                      <motion.div
                                        key={`stat-fx-${floatingStatFX[idx].id}`}
                                        initial={{ opacity: 0, y: 12, scale: 0.7 }}
                                        animate={{ opacity: 1, y: -20, scale: 1.15 }}
                                        exit={{ opacity: 0, y: -36, scale: 0.8 }}
                                        transition={{ duration: 1.0, ease: "easeOut" }}
                                        className={cn(
                                          "absolute -top-3 left-1/2 -translate-x-1/2 z-[120] px-2.5 py-0.5 rounded-full border-2 font-black text-xs tracking-wider shadow-2xl pointer-events-none whitespace-nowrap flex items-center gap-1 font-mono",
                                          floatingStatFX[idx].isPositive
                                            ? "bg-emerald-600 border-emerald-300 text-white shadow-[0_0_18px_rgba(16,185,129,0.9)]"
                                            : "bg-rose-600 border-rose-300 text-white shadow-[0_0_18px_rgba(244,63,94,0.9)]"
                                        )}
                                      >
                                        <span>{floatingStatFX[idx].text}</span>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                  {/* Matgo stack badge */}
                                  {battleType === 'matgo' && matgoBoardStacks[idx] && matgoBoardStacks[idx].length > 1 && (
                                    <div className="absolute -top-1.5 -left-1.5 z-[70] bg-amber-600 border-2 border-white text-white font-black text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                      x{matgoBoardStacks[idx].length}
                                    </div>
                                  )}
                                  {/* Ability Indicator */}
                                  {card.ability && (
                                    <motion.div
                                      className={cn(
                                        "absolute -top-1.5 -right-1.5 z-[60] w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg",
                                        card.ability.type === 'POWER_BOOST' ? "bg-yellow-400" :
                                        card.ability.type === 'WEAKEN' ? "bg-purple-600" :
                                        card.ability.type === 'REINFORCE' ? "bg-green-500" :
                                        card.ability.type === 'SHIELD' ? "bg-blue-400" :
                                        card.ability.type === 'WALL' ? "bg-gray-700" :
                                        "bg-red-600" // PIERCE
                                      )}
                                      title={language === 'ko' ? card.ability.description_ko : card.ability.description_en}
                                    >
                                      {card.ability.type === 'WALL' ? <Fence size={10} className="text-white" /> :
                                       card.ability.type === 'PIERCE' ? <TargetIcon size={10} className="text-white" /> :
                                       <Sparkles size={10} className="text-white" />}
                                    </motion.div>
                                  )}
                                  {/* Elemental Badge */}
                                  {(() => {
                                    const normEl = getNormalizedElement(card);
                                    if (!normEl) return null;
                                    return (
                                      <div className={cn(
                                        "absolute -bottom-1 -left-1 z-[60] w-6 h-6 rounded-full border border-white flex items-center justify-center shadow-md",
                                        normEl === 'water' ? "bg-blue-500/90" :
                                        normEl === 'fire' ? "bg-red-500/90" :
                                        normEl === 'wind' ? "bg-emerald-500/90" :
                                        normEl === 'land' ? "bg-amber-700/90" :
                                        normEl === 'human' ? "bg-sky-400/90" :
                                        normEl === 'undead' ? "bg-purple-900/90" :
                                        normEl === 'elf' ? "bg-green-600/90" :
                                        normEl === 'dwarf' ? "bg-zinc-700/90" :
                                        normEl === 'monster' ? "bg-orange-600/90" :
                                        normEl === 'robot' ? "bg-slate-500/90" :
                                        normEl === 'dragon' ? "bg-rose-700/90" :
                                        "bg-gray-400/90"
                                      )}>
                                        {normEl === 'water' && <Waves size={11} className="text-white" />}
                                        {normEl === 'fire' && <Flame size={11} className="text-white" />}
                                        {normEl === 'wind' && <Wind size={11} className="text-white" />}
                                        {normEl === 'land' && <Mountain size={11} className="text-white" />}
                                        {normEl === 'human' && <User size={11} className="text-white" />}
                                        {normEl === 'undead' && <Skull size={11} className="text-white" />}
                                        {normEl === 'elf' && <Leaf size={11} className="text-white" />}
                                        {normEl === 'dwarf' && <Hammer size={11} className="text-white" />}
                                        {normEl === 'monster' && <Ghost size={11} className="text-white" />}
                                        {normEl === 'robot' && <Bot size={11} className="text-white" />}
                                        {normEl === 'dragon' && <Zap size={11} className="text-white" />}
                                      </div>
                                    );
                                  })()}
                                  {/* Item 369: Sleek 12px Corner Element Affinity Pip */}
                                  {elementalBoard[idx] && getNormalizedElement(card) === elementalBoard[idx] && (
                                    <div className="absolute top-0.5 left-0.5 z-[65] px-1 py-0.5 bg-black/90 border border-amber-400 text-amber-300 font-mono text-[8.5px] font-black rounded-xs shadow-md pointer-events-none whitespace-nowrap">
                                      {elementalBoard[idx] === 'fire' && '[🔥+2]'}
                                      {elementalBoard[idx] === 'water' && '[💧+2]'}
                                      {elementalBoard[idx] === 'wind' && '[🌪️+2]'}
                                      {elementalBoard[idx] === 'land' && '[🌱+2]'}
                                      {elementalBoard[idx] !== 'fire' && elementalBoard[idx] !== 'water' && elementalBoard[idx] !== 'wind' && elementalBoard[idx] !== 'land' && `[+2]`}
                                    </div>
                                  )}
                                </motion.div>
                              ) : (
                                <div key={`empty-${idx}`} className="opacity-5 font-bold text-sm">{idx}</div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
               </div>
            {/* DESKTOP RIGHT SIDEBAR: VERTICAL SCOREBOARD (lg:flex ONLY) */}
            {!gameOver && gameState === 'playing' && (
              <div className="hidden lg:flex flex-col items-center justify-center shrink-0 z-20 pointer-events-none select-none gap-3">
                {/* 2. SCOREBOARD */}
                <div className="flex flex-col gap-1 items-center bg-[#201d1d] rounded-none p-1.5 border border-[rgba(255,255,255,0.15)] shadow-none">
                  {/* Enemy Score */}
                  <div className="flex flex-col items-center gap-0.5 p-1 bg-rose-950/30 rounded-none border border-rose-800/40">
                    <span className="text-[7px] font-mono font-bold uppercase text-rose-400 [writing-mode:vertical-lr] tracking-widest">[ENEMY]</span>
                    <div className="w-7 h-7 rounded-none bg-[#141212] border border-rose-700/50 flex items-center justify-center text-sm font-bold text-rose-400 font-mono">
                      {battleType === 'matgo' ? matgoScores.ai : boardScore.ai}
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="py-0.5 opacity-20">
                    <div className="w-3 h-[1px] bg-white" />
                  </div>
    
                  {/* Player Score */}
                  <div className="flex flex-col items-center gap-0.5 p-1 bg-indigo-950/30 rounded-none border border-indigo-800/40">
                    <div className="w-7 h-7 rounded-none bg-[#141212] border border-indigo-700/50 flex items-center justify-center text-sm font-bold text-indigo-400 font-mono">
                      {battleType === 'matgo' ? matgoScores.player : boardScore.player}
                    </div>
                    <span className="text-[7px] font-mono font-bold uppercase text-indigo-400 [writing-mode:vertical-lr] tracking-widest">[YOU]</span>
                  </div>
                </div>
              </div>
            )}

            {/* DESKTOP 2XL+: TACTICAL LOG (Wide Screen Only) */}
            {!gameOver && gameState === 'playing' && (
              <div className="hidden 2xl:flex flex-col gap-2 shrink-0 z-20 pointer-events-auto">
                {/* Desktop Sidebar Log */}
                <div className="w-40 xl:w-44 flex flex-col gap-2 h-[320px]">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-2 flex items-center gap-2">
                    <Terminal size={10} />
                    <span>TACTICAL_LOG</span>
                  </div>
                  <div className="flex-1 bg-[#0f172a]/95 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col p-3 shadow-xl">
                     <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar scrollbar-hide">
                        <AnimatePresence initial={false}>
                          {visibleGameLogs.map((log) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "text-[8px] xl:text-[9px] leading-tight font-black uppercase tracking-tighter p-1.5 rounded-lg border-l-2",
                                log.type === 'capture' ? "bg-red-950/40 border-red-500/50 text-red-300" : 
                                log.type === 'system' ? "bg-yellow-950/40 border-yellow-500/50 text-yellow-350" :
                                "bg-slate-900/40 border-slate-800 text-slate-350"
                              )}
                            >
                              {log.text}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                     </div>
                     <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between opacity-30 text-[8px] font-bold text-white/40">
                        <span>V.4.2</span>
                        <Activity size={10} className="animate-pulse" />
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* QTE Skill Timing Button */}
            {!gameOver && gameState === 'playing' && (
              <div className="absolute left-2 md:left-4 bottom-2 sm:bottom-4 md:bottom-[120px] z-20">
                <SkillTimingButton
                  chargeTime={1500}
                  inputWindow={3000}
                  successMultiplier={1.10}
                  cooldownTime={8000}
                  lowSpecMode={lowSpecMode}
                  disabled={turn !== 'player'}
                  isPlaying={gameState === 'playing' && !gameOver}
                  lang={language}
                  onSuccess={(multiplier) => {
                    setPendingQteMultiplier(multiplier);
                    setQteMatchSummary(prev => ({
                      attempted: true,
                      successCount: prev.successCount + 1,
                      lastMultiplier: multiplier,
                    }));
                    addLog(t('synergy_qte_success', language, { multiplier: multiplier.toFixed(2) }), 'system');
                  }}
                  onFail={() => {
                    setPendingQteMultiplier(null);
                    setQteMatchSummary(prev => ({
                      ...prev,
                      attempted: true,
                    }));
                    addLog(t('synergy_qte_failed', language), 'system');
                  }}
                />
              </div>
            )}
         </div>
      </div>

    </div>

      {/* 3. 내 덱/패 영역 (카드 높이에 맞춰 컴팩트 조정) */}
      <div 
        id="player-hand-container"
        className={cn(
        "h-auto py-0.5 sm:py-1 md:py-1.5 relative overflow-visible flex flex-col items-center justify-center p-0.5 sm:p-1 w-full bg-[#0f172a] bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] border-2 box-border bg-clip-padding rounded-2xl shadow-sm shrink-0",
        turn === 'player' && !gameOver ? "border-indigo-500/50 z-20" : "border-blue-500/20 z-10"
      )}>
        
        {/* Item 357: Player 1-Line Slim Monospace Tag (Visible on Mobile & Desktop) & Row 66: Hand/Deck Counter Badge */}
        <div className="absolute top-1 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 bg-indigo-950/90 text-indigo-200 text-[8px] sm:text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm shadow-xs border border-indigo-500/40 backdrop-blur-xs pointer-events-auto">
            <span className="text-indigo-400 font-black">[YOU]</span>
            <span className="truncate max-w-[70px] sm:max-w-[120px] text-white">{effectiveUser?.displayName || effectiveUser?.name || 'YOU'}</span>
            <span className="text-slate-500">·</span>
            <span>TP {(calculatedTotalPower || 1000).toLocaleString()}</span>
            {sns !== undefined && sns > 0 && (
              <>
                <span className="text-slate-500">·</span>
                <span className="text-amber-300">🪙{sns.toLocaleString()}</span>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsEmoteModalOpen(true)}
              className="ml-1 px-1.5 py-0.2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[8px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow-2xs"
              title={language === 'ko' ? '감정표현 보내기' : 'Send Emote'}
            >
              <span>💬</span>
              <span>{language === 'ko' ? '감정' : 'Emote'}</span>
            </button>
          </div>

          {/* Row 66: Player Hand Cards & Deck Stack Remaining Counter Badge */}
          <div className="flex items-center gap-1 bg-slate-900/90 text-slate-300 text-[8px] sm:text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm border border-slate-700/60 shadow-xs backdrop-blur-xs pointer-events-auto">
            <span className="text-cyan-400 font-black">
              {language === 'ko' ? `손패 ${playerHand.length}장` : `Hand: ${playerHand.length}`}
            </span>
            <span className="text-slate-500">/</span>
            <span className="text-amber-400 font-black">
              {language === 'ko' ? `잔여 ${Math.max(0, 5 - (9 - board.filter(c => c !== null).length - opponentHand.length))}장` : `Deck: ${Math.max(0, 5 - (9 - board.filter(c => c !== null).length - opponentHand.length))}`}
            </span>
          </div>
        </div>

        <div className={cn(
          "w-full max-w-6xl mx-auto flex items-center gap-1 md:gap-2 h-auto py-0.5 md:py-1 overflow-x-auto overflow-y-visible scrollbar-hide px-4 touch-pan-x relative z-10 my-auto select-none [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]",
          playerHand.length > 5 ? "justify-start md:justify-center" : "justify-center"
        )}>


          <AnimatePresence>
            {playerHand.map((card, idx) => {
              const isRecommended = recommendedPlayerMove?.cardIdx === idx;
              const isSelected = selectedCardIdx === idx && selectedCardSide === 'player';
              
              return (
              <motion.div
                key={card.id}
                onClick={() => handleCardClick(idx, 'player')}
                onPointerDown={() => handleHandCardPointerDown(card)}
                onPointerUp={handleHandCardPointerUp}
                onPointerLeave={handleHandCardPointerUp}
                onPointerCancel={handleHandCardPointerUp}
                initial={{ opacity: 0, scale: 0.9, y: 0 }}
                animate={{ 
                  opacity: 1,
                  y: isSelected ? -20 : 0,
                  scale: isSelected ? 1.08 : (isRecommended ? 1.03 : 1)
                }}
                exit={{ opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15 } }}
                transition={{ duration: 0.15 }}
                whileHover={{ 
                  y: isSelected ? -28 : -10,
                  scale: isSelected ? 1.1 : 1.05
                }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-[16vw] max-w-[58px] sm:max-w-[68px] md:max-w-[80px] lg:max-w-[88px] aspect-[5/7] cursor-pointer flex-shrink-0 relative mx-0.5 md:mx-1 rounded-lg [will-change:transform,opacity]",
                  isSelected && "z-50"
                )}
              >
                {isRecommended && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.8)] z-50 animate-pulse pointer-events-none"
                  >
                    RECOMMENDED
                  </motion.div>
                )}
                {isRecommended && (
                   <div className="absolute inset-[-2px] bg-blue-500/40 rounded z-[-1]"></div>
                )}
                {/* Highlight Glow for Selected Card */}
                {selectedCardIdx === idx && selectedCardSide === 'player' && (
                  <div className="absolute -inset-1 bg-indigo-500/40 rounded-xl z-0 pointer-events-none ring-2 ring-indigo-400" />
                )}
                
                <CardItem 
                  card={card} 
                  isLocked={turn !== 'player'} 
                  isSelected={selectedCardIdx === idx && selectedCardSide === 'player'}
                  className={cn(
                    "w-full h-full relative z-10 rounded-lg",
                    isRecommended && "shadow-[0_0_15px_rgba(96,165,250,0.5)]"
                  )} 
                  customImage={customCardImage}
                  lowSpecMode={isLowPerformance}
                  isMatgo={false}
                />
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      </div>
      </div>

      {/* Cortana AI Bottom Scroll Section (화면 최하단에 스크롤하여 확인) */}
      {isAutoBattle && !gameOver && (
        <div id="cortana-ai-bottom-section" className="w-full max-w-5xl mx-auto mt-6 pt-4 border-t border-slate-800/80 px-3 sm:px-4 pb-12 flex flex-col items-center shrink-0">
          <button
            type="button"
            onClick={() => setShowCortanaHud(prev => !prev)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/30 text-[10px] font-mono font-bold text-indigo-300 tracking-wider uppercase shadow-xs transition-all active:scale-95 cursor-pointer"
            title={language === 'ko' ? '코타나 AI 전술 HUD 열기/접기' : 'Toggle Cortana AI HUD'}
          >
            <Cpu size={13} className="text-indigo-400" />
            <span>
              {showCortanaHud
                ? (language === 'ko' ? '[ ▲ 코타나 AI 전술 HUD 접기 ]' : '[ ▲ COLLAPSE CORTANA AI HUD ]')
                : (language === 'ko' ? '[ ▼ 코타나 AI 전술 분석창 (스크롤하여 확인) ]' : '[ ▼ CORTANA AI TACTICAL HUD (SCROLL DOWN) ]')}
            </span>
          </button>

          <AnimatePresence>
            {showCortanaHud && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full mt-3 overflow-hidden"
              >
                {/* AI Tactical Cortana Operator HUD */}
                <div className="bg-slate-950/90 border border-indigo-500/40 rounded-3xl p-4 shadow-[0_0_30px_rgba(99,102,241,0.2)] backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row gap-4">
                  
                  {/* Hologram Grid Overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)+50%,rgba(0,0,0,0.2)+50%),linear-gradient(90deg,rgba(99,102,241,0.04),rgba(0,0,0,0),rgba(244,63,94,0.04))] bg-[size:100%_4px,6px_100%] z-10 opacity-40 animate-pulse" />
                  
                  {/* Left: CORTANA ACTIVE HOLOGRAM AVATAR */}
                  <div className="flex items-center gap-3 border-b md:border-b-0 md:border-r border-indigo-500/10 pb-3 md:pb-0 md:pr-4 shrink-0 justify-center">
                    <div className="relative w-16 h-16 rounded-full flex items-center justify-center bg-indigo-950/40 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                      {/* Rotating External Ring */}
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-t-2 border-b-2 border-indigo-400/40 rounded-full scale-110"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-1 border-r-2 border-l-2 border-indigo-300/30 rounded-full border-dashed scale-105"
                      />
                      {/* Core Avatar Pulsing */}
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.12, 1],
                          boxShadow: ["0 0 10px rgba(99,102,241,0.4)", "0 0 25px rgba(99,102,241,0.7)", "0 0 10px rgba(99,102,241,0.4)"] 
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-400 to-indigo-900 flex items-center justify-center relative overflow-hidden"
                      >
                        <Cpu size={20} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
                      </motion.div>
                      {/* AI Voice Activity Waveforms */}
                      <div className="absolute -bottom-1 flex gap-0.5 items-end justify-center w-full">
                        <motion.span animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} className="w-1 bg-indigo-400 rounded-full" />
                        <motion.span animate={{ height: [6, 16, 6] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} className="w-1 bg-indigo-300 rounded-full" />
                        <motion.span animate={{ height: [4, 14, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} className="w-1 bg-indigo-400 rounded-full" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-indigo-400 tracking-wider">CORTANA.AI</h4>
                      <p className="text-[7px] text-slate-500 font-bold tracking-widest uppercase">TACTICAL_SYS_ACTIVE</p>
                    </div>
                  </div>

                  {/* Middle Left: WIN PROBABILITY */}
                  <div className="flex-1 min-w-[170px] flex flex-col justify-between border-b md:border-b-0 md:border-r border-indigo-500/10 pb-3 md:pb-0 md:pr-4">
                    <div className="flex justify-between items-center text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Activity size={10} className="text-indigo-400 animate-pulse" />
                        {t('operator_hud_win_rate', language)}
                      </span>
                      <span className="font-mono text-indigo-200 bg-indigo-500/10 px-1.5 py-0.5 rounded shadow-sm">{winProbability}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 border border-indigo-500/20 overflow-hidden p-[2px] shadow-inner">
                      <motion.div 
                        initial={{ width: '50%' }}
                        animate={{ width: `${winProbability}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-700 rounded-full"
                        transition={{ type: 'spring', stiffness: 85, damping: 15 }}
                      />
                    </div>
                    <p className="text-[8px] text-slate-500 leading-relaxed font-semibold">
                      {language === 'ko' ? "* 코타나가 콤보 및 배치 데이터를 실시간 검정 중." : "* Cortana checking board placements & combos."}
                    </p>
                  </div>

                  {/* Middle Right: THREAT DETECTOR */}
                  <div className="flex-1 min-w-[200px] flex flex-col justify-between border-b md:border-b-0 md:border-r border-indigo-500/10 pb-3 md:pb-0 md:pr-4">
                    <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <TargetIcon size={10} className="animate-spin-slow text-rose-400" />
                      {t('operator_hud_threat', language)}
                    </div>
                    {threatTarget ? (
                      <div className="flex items-center gap-2.5 bg-rose-950/20 border border-rose-500/20 rounded-xl p-1.5">
                        <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center font-black text-[10px] text-rose-400 border border-rose-500/20">
                          {threatTarget.power}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] font-black text-slate-300 truncate">{getFormattedCardName(threatTarget, language)}</div>
                          <div className="text-[7px] text-slate-500 truncate">
                            {threatTarget.ability 
                              ? (typeof threatTarget.ability === 'object' 
                                  ? `Ability: ${language === 'ko' ? (threatTarget.ability.description_ko || threatTarget.ability.type) : (threatTarget.ability.description_en || threatTarget.ability.type)}`
                                  : `Ability: ${threatTarget.ability}`)
                              : 'Standard Threat Class'}
                          </div>
                        </div>
                        <span className="text-[7px] font-black text-rose-400 animate-pulse bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-500/30">LOCKED</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-10 border border-dashed border-slate-800 rounded-xl text-[8px] text-slate-600">
                        {language === 'ko' ? "위협 감지 대기 중..." : "Waiting for threats..."}
                      </div>
                    )}
                  </div>

                  {/* Right: LOGS & INTERACTIVE PROMPT POPUPS */}
                  <div className="flex-[1.3] min-w-[240px] flex flex-col justify-between relative">
                    <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Terminal size={10} className="text-indigo-400" />
                        {t('operator_hud_log', language)}
                      </span>
                      <span className="text-[7px] opacity-40">STANCE: {adaptiveStrategy.toUpperCase()}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-indigo-500/10 min-h-[48px] max-h-[60px] overflow-y-auto space-y-0.5 scrollbar-hide">
                      {operatorLogs.length > 0 ? (
                        operatorLogs.slice(0, 3).map((log, idx) => (
                          <div key={idx} className={cn("text-[8.5px] font-semibold leading-normal flex items-start gap-1", idx === 0 ? "text-indigo-300" : "text-slate-600")}>
                            <span className="text-indigo-500 font-black">{">"}</span>
                            <span className="break-all">{log}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[8px] text-slate-600 italic">No activity logs.</div>
                      )}
                    </div>

                    {/* Cortana Voice Question Prompt Container */}
                    <AnimatePresence>
                      {operatorPrompt && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.96, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: 8 }}
                          className="absolute inset-0 bg-slate-950/95 border border-indigo-400/80 rounded-xl p-2 pr-14 md:pr-2 flex flex-col justify-between z-30 shadow-2xl shadow-indigo-500/30"
                        >
                          <div className="text-[8.5px] font-black text-indigo-200 animate-pulse flex items-center gap-1.5">
                            <Terminal size={9} className="text-indigo-400" />
                            {operatorPrompt.question}
                          </div>
                          <div className="flex gap-1.5 mt-1.5">
                            {operatorPrompt.options.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => handleSelectOperatorTactic(opt.strategy || 'balanced')}
                                className="flex-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 hover:border-indigo-400 text-[8px] font-black py-1 px-0.5 rounded-lg text-indigo-300 transition-all text-center tracking-tighter"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {gameOver && (
          <motion.div
            key="game-over-summary-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-4 md:p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900/95 rounded-3xl p-6 md:p-10 max-w-md w-full space-y-6 shadow-2xl border border-slate-800 relative overflow-hidden text-white backdrop-blur-xl"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500" />
              
              <div className="space-y-2">
                <motion.div
                  initial={{ rotate: -5, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <h2 className={cn(
                    "text-5xl md:text-6xl font-black tracking-tighter uppercase drop-shadow-md",
                    winner === 'player' ? "text-amber-500" : 
                    winner === 'ai' ? "text-rose-500" : 
                    "text-gray-400"
                  )}>
                    {winner === 'player' ? t('victory', language) : winner === 'ai' ? t('defeat', language) : t('draw', language)}
                  </h2>
                </motion.div>
                <p className="text-[9px] font-bold opacity-30 tracking-[0.3em] uppercase">Combat_Session_Terminal</p>
                
                {/* 전투 패배 5초 자동 닫힘 안내 뱃지 */}
                {winner === 'ai' && defeatExitCountdown !== null && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-2 py-1.5 px-4 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-black uppercase tracking-wider animate-pulse flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>
                      {language === 'ko'
                        ? (isStoryActive || isBossActive || isDungeonActive || isTournamentActive
                            ? `${defeatExitCountdown}초 후 자동으로 이전 화면으로 돌아갑니다...`
                            : `${defeatExitCountdown}초 후 자동으로 로비로 이동합니다...`)
                        : (isStoryActive || isBossActive || isDungeonActive || isTournamentActive
                            ? `Auto closing in ${defeatExitCountdown}s...`
                            : `Auto returning to lobby in ${defeatExitCountdown}s...`)}
                    </span>
                  </motion.div>
                )}
                
                {/* 압도적 승리 및 연승 뱃지 노출 영역 */}
                {winner === 'player' && (showOverwhelmingEffect || showStreakEffect) && (
                  <div className="flex flex-col gap-2 items-center justify-center mt-2 relative z-10">
                    {showOverwhelmingEffect && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs uppercase rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1.5 animate-pulse"
                      >
                        <Sparkles size={12} className="animate-spin text-white" />
                        <span>{t('overwhelming_victory', language)} (+20% SNS)</span>
                        <Sparkles size={12} className="animate-spin text-white" />
                      </motion.div>
                    )}
                    {showStreakEffect && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.15 }}
                        className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold text-xs uppercase rounded-full shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
                      >
                        <Zap size={12} className="animate-bounce text-yellow-300 fill-current" />
                        <span>{t('streak_victory_bonus', language).replace('{streak}', String(currentWinStreakDisplay))} (+20% SNS)</span>
                        <Zap size={12} className="animate-bounce text-yellow-300 fill-current" />
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-950/20 p-4 rounded-2xl border border-indigo-500/20 shadow-sm">
                  <div className="text-[8px] font-bold text-indigo-400 uppercase mb-1">{t('user', language)}</div>
                  <div className="text-4xl font-extrabold italic text-indigo-400">
                    {battleType === 'matgo' ? matgoScores.player : boardScore.player}
                  </div>
                </div>
                <div className="bg-rose-950/20 p-4 rounded-2xl border border-rose-500/20 shadow-sm">
                  <div className="text-[8px] font-bold text-rose-400 uppercase mb-1">{t('ai', language)}</div>
                  <div className="text-4xl font-extrabold italic text-rose-400">
                    {battleType === 'matgo' ? matgoScores.ai : boardScore.ai}
                  </div>
                </div>
              </div>

              {/* Battle Result Summary Panel (SNS points gained, Total damage dealt/received, Cards leveled up) */}
              <BattleResultPanel
                result={winner === 'player' ? 'win' : winner === 'ai' ? 'loss' : 'draw'}
                snsEarned={rewardEarned}
                totalDamageDealt={totalDamageDealt > 0 ? totalDamageDealt : (boardScore.player * 85 + (winner === 'player' ? 320 : 120))}
                totalDamageReceived={totalDamageReceived > 0 ? totalDamageReceived : (boardScore.ai * 85 + (winner === 'ai' ? 320 : 120))}
                leveledUpCards={leveledUpCards}
                allDeckCardsProgress={allDeckCardsProgress}
                usedCards={playerDeck}
                battleType={battleType}
                language={language}
                isSpeedAttackBonus={isSpeedAttackWin}
                isUnderdogBonus={underdogBountyClaimed}
                isGoblinBonus={goblinCaptured}
                isManaSpringBonus={manaSpringClaimed}
                isElementalComboBonus={hasTriggeredElementalCombo}
                isIroncladBonus={isIroncladWin}
                opponentName={lastOpponent?.name || (battleType === 'robot' ? 'AI 로봇' : language === 'ko' ? '라이벌 사령관' : 'Rival Commander')}
                opponentAvatar={lastOpponent?.avatar}
                opponentLevel={lastOpponent?.level || 15}
                opponentMainCardTitle={opponentDeck[0]?.title || (language === 'ko' ? '카단 (SSR)' : 'Kadan (SSR)')}
                onShareToCommunity={() => setShowBattleShareTemplate(true)}
                onOpenDetailedSummary={() => setShowPostBattleSummaryModal(true)}
              />

              {/* Match Analysis Section */}
              {battleType !== 'matgo' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-sm text-left space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Match_Analysis</span>
                  <span className={cn(
                    "text-[9px] font-semibold px-2.5 py-1 rounded-full border",
                    winner === 'player' ? "bg-indigo-950/30 border-indigo-500/30 text-indigo-300" : winner === 'ai' ? "bg-rose-950/30 border-rose-500/30 text-rose-300" : "bg-slate-900 border-slate-700 text-slate-350"
                  )}>
                    {(() => {
                      const pScore = boardScore.player;
                      const aScore = boardScore.ai;
                      const diff = Math.abs(pScore - aScore);
                      if (winner === 'draw') return "STALEMATE";
                      if (diff >= 5) return "FLAWLESS_VICTORY";
                      if (diff >= 3) return "MAJOR_CONTROL";
                      return "NEURAL_OVERRIDE";
                    })()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-300">
                    <span className="opacity-60 uppercase">Power_Balance:</span>
                    <span className="font-bold">
                      {boardScore.player} PTS ({Math.round((boardScore.player / Math.max(1, boardScore.player + boardScore.ai)) * 100)}%) VS {boardScore.ai} PTS ({Math.round((boardScore.ai / Math.max(1, boardScore.player + boardScore.ai)) * 100)}%)
                    </span>
                  </div>
                  <div className="relative w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-850">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(boardScore.player / Math.max(1, boardScore.player + boardScore.ai)) * 100}%` }}
                      className="h-full bg-indigo-500 flex items-center justify-end px-2"
                    >
                      <span className="text-[7px] text-white font-bold italic">YOU</span>
                    </motion.div>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(boardScore.ai / Math.max(1, boardScore.player + boardScore.ai)) * 100}%` }}
                      className="h-full bg-rose-500 flex items-center justify-start px-2"
                    >
                      <span className="text-[7px] text-white font-bold italic text-right w-full">AI</span>
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold opacity-60 text-slate-300">
                    <span>BOARD_DOMINANCE:</span>
                    <span>
                      {((winner === 'player' ? boardScore.player : boardScore.ai) / 9 * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-850">
                    <div 
                      className="h-full bg-indigo-500" 
                      style={{ width: `${(boardScore.player / 9) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-rose-500" 
                      style={{ width: `${(boardScore.ai / 9) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Synergy Analysis — 세력 상성 및 장비 시너지 요약 */}
              {battleType !== 'matgo' && playerDeck.length > 0 && opponentDeck.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 shadow-sm text-left space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {t('battle_result_synergy_header', language)}
                    </span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-950/30 border border-purple-500/30 text-purple-300">
                      ANALYSIS
                    </span>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    {(() => {
                      const qteLabel = qteMatchSummary.successCount > 0 && qteMatchSummary.lastMultiplier
                        ? t('synergy_qte_success', language, { multiplier: qteMatchSummary.lastMultiplier.toFixed(2) })
                        : qteMatchSummary.attempted
                        ? t('synergy_qte_failed', language)
                        : t('synergy_qte_not_used', language);
                      return (
                        <div className="flex justify-between items-center">
                          <span className="opacity-60">QTE</span>
                          <span className={`font-bold ${qteMatchSummary.successCount > 0 ? 'text-emerald-400' : qteMatchSummary.attempted ? 'text-rose-400' : 'text-slate-400'}`}>
                            {qteLabel}
                          </span>
                        </div>
                      );
                    })()}
                    {/* 세력 상성 */}
                    {(() => {
                      const playerRep = playerDeck[0];
                      const opponentRep = opponentDeck[0];
                      if (!playerRep || !opponentRep) return null;
                      const synergySummary = calculateBattleSynergy(playerRep, opponentRep, playerRep.equipment);
                      const advantage = synergySummary.factionAdvantage;
                      const icon = FACTION_ADVANTAGE_ICONS[advantage];
                      const colorClass = FACTION_ADVANTAGE_COLORS[advantage];
                      const label = advantage === 'advantage'
                        ? t('matchup_advantage', language)
                        : advantage === 'disadvantage'
                        ? t('matchup_disadvantage', language)
                        : t('matchup_neutral', language);
                      return (
                        <div className="flex justify-between items-center">
                          <span className="opacity-60">{t('synergy_faction_bonus', language)}</span>
                          <span className={`font-bold ${colorClass}`}>
                            {icon} {label} · x{synergySummary.factionMultiplier.toFixed(2)}
                          </span>
                        </div>
                      );
                    })()}
                    {/* 장비 시너지 */}
                    {(() => {
                      const rep = playerDeck[0];
                      if (!rep?.equipment) return null;
                      const bonus = getEquipmentSetBonus(rep.equipment);
                      if (!bonus.setName) return (
                        <div className="flex justify-between items-center">
                          <span className="opacity-60">{t('synergy_equipment_bonus', language)}</span>
                          <span className="font-bold text-slate-400">{t('synergy_no_bonus', language)}</span>
                        </div>
                      );
                      return (
                        <div className="flex justify-between items-center">
                          <span className="opacity-60">{t('synergy_equipment_bonus', language)}</span>
                          <span className="font-bold text-amber-400">
                            {EQUIPMENT_SET_ICONS[bonus.setName] || ''} {bonus.setName} ({bonus.bonusCount}pc) +{bonus.powerBonus}⚡
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 🎉 Reward Celebration — 승리 보상 피드백 강화 */}
              {!isPlayground && rewardEarned > 0 ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", damping: 12 }}
                  className="relative overflow-hidden rounded-2xl p-5 flex flex-col items-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl" />
                  {/* Particle burst effect */}
                  {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * 360;
                    const rad = (angle * Math.PI) / 180;
                    return (
                      <motion.div
                        key={`rp-${i}`}
                        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        animate={{ opacity: 0, x: Math.cos(rad) * 55, y: Math.sin(rad) * 55, scale: 0 }}
                        transition={{ duration: 1.2, delay: 0.5 + i * 0.05, ease: "easeOut" }}
                        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-amber-400"
                      />
                    );
                  })}
                  {/* Coin spin animation */}
                  <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                    className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40"
                  >
                    <span className="text-xl">🪙</span>
                  </motion.div>
                  {/* Reward amount with spring animation */}
                  <motion.div
                    key={rewardEarned}
                    initial={{ y: 15, opacity: 0, scale: 0.6 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                    className="relative z-10 text-3xl font-black text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                  >
                    +{rewardEarned}<span className="text-sm font-bold ml-1 opacity-80">SNS</span>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="relative z-10 text-[9px] font-semibold text-amber-300/60 uppercase tracking-[0.2em]"
                  >
                    {t('sns_reward', language)}
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full rounded-2xl p-4 flex items-center justify-between bg-slate-800/50 border border-slate-700/50 text-slate-400"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={20} className="opacity-40" />
                    <span className="text-sm font-bold uppercase tracking-tight">
                      {isPlayground ? t('playground', language) : t('reward', language)}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold opacity-50">
                    {rewardEarned >= 0 ? `+${rewardEarned}` : rewardEarned} <span className="text-xs font-semibold">SNS</span>
                  </div>
                </motion.div>
              )}

              {/* Story Battle Result — 승리/패배 시 스토리 진행 및 보상 안내 */}
              {!isPlayground && (
                <StoryBattleResult
                  result={winner === 'player' ? 'win' : winner === 'ai' ? 'loss' : 'draw'}
                  language={language}
                  battleCompleted={currentStoryBattleCompleted}
                  rewardClaimed={currentStoryRewardClaimed}
                  storyProgressCount={storyProgressCount}
                  totalStoryEpisodes={totalStoryEpisodes}
                  showRewardAction={Boolean(currentStoryBattleContext)}
                  onClaimReward={currentStoryBattleContext ? () => claimStoryBattleReward(currentStoryBattleContext.rewardId) : undefined}
                  episodeTitle={weeklyWebtoon ? (language === 'ko' ? weeklyWebtoon.titleKo : weeklyWebtoon.titleEn) : undefined}
                  onNavigateWebtoon={() => setView?.('webtoon')}
                />
              )}

              {/* Row 30: Battle Victory EXP Gauge Animation */}
              {winner === 'player' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 shadow-md text-left space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-yellow-400 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                        {language === 'ko' ? '전투 경험치 (EXP)' : 'BATTLE EXPERIENCE'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-500/40 text-indigo-300">
                      +150 EXP
                    </span>
                  </div>

                  {/* Player EXP Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400 font-bold">
                        {language === 'ko' ? '사령관 레벨' : 'Commander Lv'}.{Math.floor((calculatedTotalPower || 1000) / 500) + 1}
                      </span>
                      <span className="text-indigo-400 font-bold">
                        {((calculatedTotalPower || 1000) % 500)} / 500 EXP
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <motion.div
                        initial={{ width: "35%" }}
                        animate={{ width: "72%" }}
                        transition={{ duration: 1.4, delay: 0.6, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-indigo-600 to-cyan-400 rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Hero Card EXP gain */}
                  {playerDeck[0] && (
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-300 font-mono">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-amber-400 font-bold">[{getFormattedCardName(playerDeck[0], language)}]</span>
                        <span className="text-slate-400">Card EXP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-400 font-bold">+85 EXP</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8px] font-black border border-amber-500/40 animate-pulse">
                          LEVEL UP!
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Item 53: 상대방 유저 친구 신청 & 프로필 조회 퀵 버튼 */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    const oppName = pvpOpponent?.name || 'Opponent Hero';
                    const oppUid = pvpOpponent?.id || 'opp-' + Date.now();
                    try {
                      const raw = localStorage.getItem('hero_friends');
                      const friendsList = raw ? JSON.parse(raw) : [];
                      if (!friendsList.some((f: any) => f.uid === oppUid)) {
                        friendsList.push({
                          uid: oppUid,
                          name: oppName,
                          battleCount: 1,
                          lastBattleTime: Date.now(),
                          avatar: ''
                        });
                        localStorage.setItem('hero_friends', JSON.stringify(friendsList));
                      }
                      triggerAlert(
                        language === 'ko' ? `${oppName}님에게 친구 신청을 보냈습니다!` : `Sent friend request to ${oppName}!`,
                        language === 'ko' ? '친구 신청 완료' : 'Friend Request Sent'
                      );
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <UserPlus size={14} />
                  {language === 'ko' ? '친구 신청' : 'Add Friend'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const oppName = pvpOpponent?.name || 'Opponent Hero';
                    const oppPower = opponentTotalPower || pvpOpponent?.totalPower || 1280;
                    triggerAlert(
                      language === 'ko'
                        ? `[상대 프로필 요약]\n닉네임: ${oppName}\n전투력: ${oppPower.toLocaleString()} PW\n대표 카단/전력: Level 12 (SR+)\n시즌 성적: 24승 5패 (승률 82.7%)\n소속 길드: [S] 혁명단`
                        : `[Opponent Profile Summary]\nName: ${oppName}\nPower: ${oppPower.toLocaleString()} PW\nLeader Card: Level 12 (SR+)\nSeason Record: 24W 5L (82.7% Win Rate)\nGuild: [S] Revolution`,
                      language === 'ko' ? '상대 프로필 조회' : 'Inspect Profile'
                    );
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Eye size={14} />
                  {language === 'ko' ? '프로필 조회' : 'Inspect Profile'}
                </button>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                {/* Item 42: 전투 승리 화면 내 '다음 스테이지 바로 진행 (Next Stage)' 연속 플레이 버튼 */}
                {winner === 'player' && (
                  <button 
                    onClick={() => {
                      setShowBattleShareTemplate(false);
                      setShowOverwhelmingEffect(false);
                      setShowStreakEffect(false);
                      handleRematch();
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black uppercase tracking-wider active:scale-95 transition-all rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
                  >
                    <Play size={18} fill="currentColor" />
                    {language === 'ko' ? '▶ 다음 스테이지 바로 진행 (Next Stage)' : '▶ Proceed to Next Stage'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowBattleShareTemplate(true)}
                  className="w-full py-3 font-bold uppercase tracking-wider active:scale-95 transition-all rounded-2xl flex items-center justify-center gap-2 bg-white/10 text-white hover:bg-white/15 border border-white/10 shadow-lg shadow-black/20 text-xs"
                >
                  <Share2 size={16} />
                  {t('share_template_battle_result', language)}
                </button>
                <button 
                  onClick={() => {
                    setDefeatExitCountdown(null);
                    handleExitMatch(false);
                    setShowBattleShareTemplate(false);
                    setShowOverwhelmingEffect(false);
                    setShowStreakEffect(false);
                    setCurrentWinStreakDisplay(0);
                  }}
                  className="w-full py-3 font-bold uppercase tracking-wider active:scale-95 transition-all rounded-2xl flex items-center justify-center gap-2 bg-slate-950 text-white hover:bg-slate-900 border border-slate-850 shadow-lg shadow-black/30 text-xs cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  {winner === 'ai' && defeatExitCountdown !== null
                    ? (language === 'ko'
                        ? (isStoryActive || isBossActive || isDungeonActive || isTournamentActive
                            ? `돌아가기 (${defeatExitCountdown}초)`
                            : `로비로 돌아가기 (${defeatExitCountdown}초)`)
                        : (isStoryActive || isBossActive || isDungeonActive || isTournamentActive
                            ? `Back (${defeatExitCountdown}s)`
                            : `Back to Lobby (${defeatExitCountdown}s)`))
                    : (battleType === 'pvp_attack' 
                        ? (pvpExitCountdown !== null 
                            ? `${t('exit_battle', language)} (${pvpExitCountdown}s)` 
                            : t('exit_battle', language)) 
                        : t('back_to_lobby', language))}
                </button>
                {!isBossActive && !isStoryActive && !isDungeonActive && !isTournamentActive && winner !== 'player' && (
                  <>
                    <button 
                       onClick={() => {
                         setShowBattleShareTemplate(false);
                         handleRematch();
                       }}
                       className="w-full bg-indigo-600 text-white py-3 font-bold uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all rounded-2xl shadow-lg shadow-indigo-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw size={15} />
                      <span>
                        {rematchCountdown !== null
                          ? t('rematch_countdown', language)
                              .replace('{seconds}', String(rematchCountdown))
                              .replace('{text}', t('rematch', language))
                          : t('rematch', language)}
                      </span>
                    </button>
                    {setView && (
                      <button
                        type="button"
                        onClick={() => {
                          setDefeatExitCountdown(null);
                          handleExitMatch(false);
                          setShowBattleShareTemplate(false);
                          setShowOverwhelmingEffect(false);
                          setShowStreakEffect(false);
                          setCurrentWinStreakDisplay(0);
                          setView('deck');
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 py-3 font-bold uppercase tracking-wider active:scale-95 transition-all rounded-2xl shadow-lg text-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sliders size={15} />
                        <span>{language === 'ko' ? '덱 편집하러 가기' : 'Edit Deck'}</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="pt-4 flex justify-between items-center opacity-25 text-[8px] font-sans font-semibold text-slate-400">
                 <span>TX_ID: 0x{Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                 <span>SECURE_SYNC_COMPLETE</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBattleShareTemplate && (
          <ShareTemplateCard
            templateType="battle-result"
            language={language}
            totalPower={matchInfo?.playerPower ?? calculatedTotalPower}
            opponentPower={matchInfo?.opponentPower ?? opponentTotalPower ?? lastOpponent?.totalPower ?? 0}
            battleResult={winner === 'player' ? 'win' : winner === 'ai' ? 'loss' : 'draw'}
            lowSpecMode={lowSpecMode}
            onClose={() => setShowBattleShareTemplate(false)}
            showToast={(msg) => triggerAlert(msg)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDeckPreviewing && (
          <motion.div
            key="deck-preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">PLAYER_IDENTIFIED</span>
                <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase truncate max-w-[150px] md:max-w-none">
                  {effectiveUser?.displayName || effectiveUser?.name || 'YOU'}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">OPPONENT_LOCKED</span>
                <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase truncate max-w-[150px] md:max-w-none">
                  {lastOpponent?.name || 'ENEMY'}
                </h2>
              </div>
            </div>

            <div className="space-y-8 md:space-y-12 w-full max-w-4xl">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                   <div className="h-px bg-white/20 w-12" />
                   <h3 className="text-white text-xs font-black uppercase tracking-[0.5em]">{t('opponent_deck_preview', language)}</h3>
                   <div className="h-px bg-white/20 w-12" />
                </div>
                
                <div className="flex justify-center gap-2 md:gap-4 overflow-x-auto py-4 px-2 no-scrollbar">
                  {opponentHand.map((card, i) => (
                    <motion.div
                      key={`preview-${card.id}-${i}`}
                      initial={{ opacity: 0, y: 50, rotateY: 90 }}
                      animate={{ opacity: 1, y: 0, rotateY: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5, type: 'spring' }}
                      className="w-[16vw] max-w-[80px] md:max-w-[120px] aspect-[5/7] rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.2)] flex-shrink-0"
                    >
                      <CardItem card={card} isLocked={true} className="w-full h-full" lowSpecMode={lowSpecMode} />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <motion.div 
                  key={`countdown-${previewCountdown}`}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl md:text-7xl font-black text-white italic drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                >
                  {previewCountdown}
                </motion.div>
                <div className="text-[10px] md:text-[12px] font-black text-white/40 uppercase tracking-[1em] ml-[1em]">
                  {t('starting_in', language).replace('{seconds}', previewCountdown.toString())}
                </div>
              </div>
            </div>

            {/* Decorative scanning circle */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none border-t-2 border-white/5 rounded-full scale-[1.2] md:scale-[1.5]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* CUSTOM CONFIRM MODAL - Neo-Brutalism Style                         */}
      {/* ================================================================= */}
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
              className="bg-slate-900 text-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative z-[10000] font-sans"
            >
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-b border-orange-600/10 flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldAlert size={20} className="text-white" />
                </div>
                <h2 className="text-base font-bold uppercase tracking-tight leading-tight">{confirmModal.title}</h2>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-sm font-semibold text-slate-300 leading-relaxed whitespace-pre-line">{confirmModal.message}</p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-slate-950/80 border border-slate-800 text-slate-400 font-semibold text-sm rounded-xl hover:bg-slate-900 transition-colors duration-200"
                >
                  {language === 'ko' ? '취소' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }}
                  className="flex-1 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors duration-200 shadow-lg shadow-indigo-600/20"
                >
                  {language === 'ko' ? '확인' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item 43: Insufficient Currency Alert Modal with Shop/Top-Up Link */}
      <AnimatePresence>
        {showInsufficientPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 rounded-3xl p-6 max-w-sm w-full border border-slate-800 shadow-2xl text-center space-y-6 font-sans text-white"
            >
              <div className="w-16 h-16 bg-red-950/30 rounded-full mx-auto flex items-center justify-center border border-red-500/30 shadow-md">
                <ShieldAlert size={32} className="text-red-500 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-100">
                  {language === 'ko' ? '재화(SNS) 부족' : 'INSUFFICIENT SNS'}
                </h3>
                <p className="text-xs font-semibold text-slate-400">
                  {t('not_enough_sns', language)}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => {
                    setShowInsufficientPopup(false);
                    handleExitMatch(false);
                    setView?.('shop');
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black py-3.5 uppercase tracking-wider text-xs rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} />
                  {language === 'ko' ? '상점/충전소 이동 (Go to Shop)' : 'Go to Shop / Top-Up'}
                </button>
                <button 
                  onClick={() => setShowInsufficientPopup(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 py-2.5 font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer border border-white/5"
                >
                  {language === 'ko' ? '닫기' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item 51: Hand Card Zoom Preview Modal */}
      <AnimatePresence>
        {previewHandCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
            onClick={() => setPreviewHandCard(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white flex flex-col items-center gap-4 relative"
            >
              <button
                onClick={() => setPreviewHandCard(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="w-[180px] aspect-[5/7] shadow-2xl rounded-xl overflow-hidden border-2 border-amber-500/50">
                <CardItem card={previewHandCard} isLocked={false} customImage={customCardImage} />
              </div>

              <div className="w-full space-y-2 text-center">
                <h3 className="text-lg font-black text-amber-400">
                  {getFormattedCardName(previewHandCard, language)}
                </h3>
                <div className="flex justify-center gap-2 text-xs font-mono">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                    Element: {String((previewHandCard as any).element || 'WATER').toUpperCase()}
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300">
                    Rarity: {previewHandCard.rarity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 italic px-2 pt-2 border-t border-slate-800">
                  {(previewHandCard as any).lore_ko || (previewHandCard as any).lore || '고대의 힘이 깃든 카드입니다.'}
                </p>
              </div>

              <button
                onClick={() => setPreviewHandCard(null)}
                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-xs"
              >
                {language === 'ko' ? '확인' : 'Confirm'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isSharing && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
          <span className="text-white font-black text-sm uppercase tracking-widest">SHARING_POST...</span>
        </div>
      )}
      {renderCustomAlertModal()}

      {/* Skill Activation Overlay Banner (Item 54) */}
      <SkillActivationOverlay
        event={activeSkillEvent}
        language={language}
        onComplete={() => setActiveSkillEvent(null)}
      />

      {/* Texture Pre-Caching Loading Screen for Low-Spec Performance Optimization */}
      {isTextureCaching && (
        <div className="fixed inset-0 z-[999999] bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-full max-w-sm bg-white border border-[#201d1d]/15 rounded-sm p-6 sm:p-8 shadow-sm">
            <div className="inline-block text-[11px] font-bold tracking-widest uppercase bg-[#201d1d] text-[#fdfcfc] px-2.5 py-1 rounded-sm mb-3">
              [GRAPHICS PRE-CACHE]
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#201d1d] mb-1">
              {language === 'ko' ? '카드 이미지 메모리 캐싱 중...' : 'Pre-caching Card Graphics...'}
            </h2>
            <p className="text-[11px] text-[#201d1d]/60 mb-5 font-sans">
              {language === 'ko' ? '저성능 기기 프레임 드롭 및 끊김 방지 최적화' : 'Optimizing for smooth 60FPS playback'}
            </p>

            <div className="w-full bg-[#f0eded] h-3 rounded-sm border border-[#201d1d]/12 overflow-hidden mb-2 relative">
              <div
                className="bg-[#201d1d] h-full transition-all duration-150 ease-out"
                style={{ width: `${Math.max(8, textureCacheProgress)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-[#201d1d] mb-3">
              <span className="text-[10px] text-[#201d1d]/70 font-mono tracking-tight">
                {language === 'ko' ? '[LOAD] 텍스처 데이터 변환 중' : '[LOAD] Processing textures'}
              </span>
              <span className="font-mono font-black">{textureCacheProgress}%</span>
            </div>

            <button
              onClick={() => setIsTextureCaching(false)}
              className="w-full mt-2 py-1.5 bg-[#201d1d] hover:bg-black text-[#fdfcfc] text-[11px] font-bold rounded-sm transition-all cursor-pointer"
            >
              {language === 'ko' ? '▶ 바로 시작하기' : '▶ Start Immediately'}
            </button>
          </div>
        </div>
      )}

      {/* Story Stage Select & Sweep Modal (Item 56, 60, 68) */}
      <StoryStageSelectModal
        isOpen={isStoryStageModalOpen}
        onClose={() => setIsStoryStageModalOpen(false)}
        language={language}
        currentProgress={storyProgressCount}
        onStartBattle={(epId) => {
          setIsStoryStageModalOpen(false);
          setIsStoryActive(true);
          setGameState('single');
        }}
        onSweepStage={(epId) => {
          // Add Sweep rewards to gold
          const currentGold = Number(localStorage.getItem('hero_gold') || 0);
          localStorage.setItem('hero_gold', String(currentGold + 600));
          window.dispatchEvent(new Event('snshero_gold_updated'));
        }}
      />

      {/* Item 384: Lucky Card Match 5-Win Streak Mini-Game Modal */}
      <LuckyMatchModal
        isOpen={isLuckyMatchOpen}
        onClose={() => setIsLuckyMatchOpen(false)}
        language={language}
        onClaimReward={(snsReward, cardRarity) => {
          if (addItem && cardRarity) {
            addItem(cardRarity);
          }
          addLog(language === 'ko'
            ? `🎁 [럭키 카드 매치 보상] +${snsReward} SNS 및 [${cardRarity.toUpperCase()}] 카드 팩을 획득했습니다!`
            : `🎁 [LUCKY MATCH REWARD] Claimed +${snsReward} SNS & [${cardRarity.toUpperCase()}] Card Pack!`,
            'victory'
          );
        }}
      />

      {/* Item 387: Post-Boss Manual Victory 3-Chest Unlock Modal */}
      <TreasureChestUnlockModal
        isOpen={isBossChestUnlockOpen}
        onClose={() => setIsBossChestUnlockOpen(false)}
        language={language}
        onClaimReward={(snsReward, itemType) => {
          if (addItem) {
            addItem('epic');
          }
          addLog(language === 'ko'
            ? `👑 [보스 토벌 전리품 상자] +${snsReward} SNS 및 [${itemType.toUpperCase()}] 획득 완료!`
            : `👑 [BOSS VICTORY CHEST] Claimed +${snsReward} SNS & [${itemType.toUpperCase()}]!`,
            'victory'
          );
        }}
      />

      {/* Item 385: Offline Expedition 8-Hour Patrol Modal */}
      <ExpeditionModal
        isOpen={isExpeditionOpen}
        onClose={() => setIsExpeditionOpen(false)}
        language={language}
        userDeck={playerDeck}
        onClaimReward={(snsReward, expReward) => {
          addLog(language === 'ko'
            ? `🧭 [원정대 순찰 보고] +${snsReward} SNS 및 +${expReward} EXP 보상을 수령했습니다!`
            : `🧭 [EXPEDITION REWARDS] Claimed +${snsReward} SNS & +${expReward} EXP!`,
            'victory'
          );
        }}
      />

      {/* Item 383: Monster Beastarium & Mini-Pet Modal */}
      <MonsterBeastariumModal
        isOpen={isBeastariumOpen}
        onClose={() => setIsBeastariumOpen(false)}
        language={language}
        onSelectPet={(pet) => {
          addLog(language === 'ko'
            ? `🐾 [동행 펫 출격] ${pet.name} (${pet.skillDescription}) 동행 활성화!`
            : `🐾 [PET COMPANION] ${pet.nameEn} (${pet.skillDescriptionEn}) now following!`,
            'system'
          );
        }}
      />

      {/* Item 389: Tactician Mastery & Board Auras Modal */}
      <TacticianMasteryModal
        isOpen={isTacticianMasteryOpen}
        onClose={() => setIsTacticianMasteryOpen(false)}
        language={language}
        onSelectAura={(skin) => {
          addLog(language === 'ko'
            ? `👑 [전술가 아우라 적용] ${skin.name} 테마가 전장에 적용되었습니다!`
            : `👑 [AURA APPLIED] ${skin.nameEn} Aura Skin activated!`,
            'system'
          );
        }}
      />

      {/* Item 392: Tower of Trials 50-Floor Challenge Modal */}
      <TowerOfTrialsModal
        isOpen={isTowerTrialsOpen}
        onClose={() => setIsTowerTrialsOpen(false)}
        language={language}
        onStartTowerFloor={(floor) => {
          setIsTowerTrialsOpen(false);
          setIsStoryActive(false);
          setGameState('single');
          addLog(language === 'ko'
            ? `🗼 [시련의 탑 ${floor}층] 도전 시작! (${floor}F 보스: 가디언)`
            : `🗼 [TOWER OF TRIALS FLOOR ${floor}] Ascent commenced!`,
            'system'
          );
        }}
      />

      {/* Item 393 & Item 405: Battle Gambit & Smart Filter Modal */}
      <BattleGambitModal
        isOpen={isGambitModalOpen}
        onClose={() => setIsGambitModalOpen(false)}
        config={gambitConfig}
        onSaveConfig={handleSaveGambitConfig}
        language={language}
        isAutoBattle={isAutoBattle}
        onToggleAutoBattle={onToggleAutoBattle}
      />

      {/* Item 397: Secret Stamp Book Modal */}
      <SecretStampBookModal
        isOpen={isSecretStampModalOpen}
        onClose={() => setIsSecretStampModalOpen(false)}
      />

      {/* Item 404: Golden Treasure Dart Mini-Game Modal */}
      <TreasureDartModal
        isOpen={isTreasureDartOpen}
        onClose={() => setIsTreasureDartOpen(false)}
      />

      {/* Item 408: Golden Pirate Roulette Mini-Game Modal */}
      <GoldenPirateRouletteModal
        isOpen={isPirateRouletteOpen}
        onClose={() => setIsPirateRouletteOpen(false)}
        language={language}
        playSfx={playSfx}
        onReward={(amount, reason) => {
          handleMinigameReward(amount, reason, reason);
        }}
      />

      {/* Item 412: Golden Archery Challenge Mini-Game Modal */}
      <GoldenArcheryModal
        isOpen={isArcheryOpen}
        onClose={() => setIsArcheryOpen(false)}
        language={language}
        playSfx={playSfx}
        onReward={(amount, reason) => {
          handleMinigameReward(amount, reason, reason);
        }}
      />

      {/* Row 51: Hand Card Long-Press Zoom Preview Modal */}
      <CardLongPressPreviewModal
        card={longPressPreviewCard}
        isOpen={Boolean(longPressPreviewCard)}
        onClose={() => setLongPressPreviewCard(null)}
        language={language}
        customImage={customCardImage}
      />

      {/* Battle Summary Modal (Post-Battle Analytics & Stats) */}
      <BattleSummaryModal
        isOpen={showPostBattleSummaryModal}
        onClose={() => setShowPostBattleSummaryModal(false)}
        summaryData={lastBattleSummaryData}
        language={language}
        lowSpecMode={lowSpecMode}
        onRematch={() => {
          setShowPostBattleSummaryModal(false);
          handleRematch();
        }}
        onResumeAutoBattle={() => {
          setShowPostBattleSummaryModal(false);
          if (setIsAutoBattle) {
            setIsAutoBattle(true);
            try {
              localStorage.setItem('hero_auto_battle_setting', JSON.stringify(true));
            } catch {
              // ignore
            }
          }
          if (gameState === 'gameOver' || gameState === 'lobby') {
            handleRematch();
          }
        }}
        onShareToCommunity={() => {
          setShowPostBattleSummaryModal(false);
          setShowBattleShareTemplate(true);
        }}
      />

      {/* Element Advantage Quick Reference Modal */}
      <ElementAdvantageModal
        isOpen={showElementAdvantageModal}
        onClose={() => setShowElementAdvantageModal(false)}
        language={language}
        lowSpecMode={lowSpecMode}
      />

      {/* Item 34: In-Battle Emote Floating Speech Bubble */}
      <AnimatePresence>
        {activeEmoteBubble && (
          <motion.div
            key={`bubble-${activeEmoteBubble.id}`}
            initial={{ opacity: 0, scale: 0.6, y: activeEmoteBubble.side === 'player' ? 24 : -24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: activeEmoteBubble.side === 'player' ? -16 : 16 }}
            className={cn(
              "fixed z-[250] pointer-events-none flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md",
              activeEmoteBubble.side === 'player'
                ? "bottom-28 left-1/2 -translate-x-1/2 bg-indigo-950/95 border-indigo-500/80 text-white shadow-indigo-500/30"
                : "top-24 left-1/2 -translate-x-1/2 bg-rose-950/95 border-rose-500/80 text-white shadow-rose-500/30"
            )}
          >
            <span className="text-2xl animate-bounce">{activeEmoteBubble.emoji}</span>
            <span className="text-xs font-black font-mono tracking-tight">{activeEmoteBubble.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item 34: In-Battle Emote Modal */}
      <InBattleEmoteModal
        isOpen={isEmoteModalOpen}
        onClose={() => setIsEmoteModalOpen(false)}
        language={language}
        onSendEmote={handleSendEmote}
        isMuted={isOpponentMuted}
        onToggleMute={handleToggleOpponentMute}
        playSfx={playSfx}
      />
    </div>
  );
};
