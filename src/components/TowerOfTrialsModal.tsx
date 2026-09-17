import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, X, Shield, Swords, Gem, Award, Lock, Play, Flame, CheckCircle, Shirt, Crown, Zap } from 'lucide-react';
import { playSfx } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';
import { TowerSweepBottomSheet } from './TowerSweepBottomSheet';
import { TowerBuffRerollModal } from './TowerBuffRerollModal';

interface TowerOfTrialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onStartFloor?: (floor: number) => void;
  onStartTowerFloor?: (floor: number) => void;
}

interface FloorData {
  floor: number;
  modifierKo: string;
  modifierEn: string;
  bossPower: number;
  diamondReward: number;
  isUnlocked: boolean;
  isCleared: boolean;
  isBoss: boolean;
  milestoneTitleKo?: string;
  milestoneTitleEn?: string;
  milestoneCostumeKo?: string;
  milestoneCostumeEn?: string;
}

interface MilestoneReward {
  floor: number;
  titleKo: string;
  titleEn: string;
  costumeKo?: string;
  costumeEn?: string;
  descriptionKo: string;
  descriptionEn: string;
}

export const TOWER_PROGRESS_KEY = 'hero_tower_trials_floor_v1';
export const TOWER_TITLES_KEY = 'hero_tower_titles_v1';
export const TOWER_ACTIVE_TITLE_KEY = 'hero_tower_active_title_v1';
export const TOWER_COSTUMES_KEY = 'hero_tower_costumes_v1';

const MILESTONES: MilestoneReward[] = [
  {
    floor: 5,
    titleKo: '탑의 도전자',
    titleEn: 'Tower Challenger',
    descriptionKo: '5층 보스를 돌파하여 시련의 자격을 증명한 영웅',
    descriptionEn: 'Proven hero who breached Floor 5 guardian',
  },
  {
    floor: 10,
    titleKo: '철벽의 수호파괴자',
    titleEn: 'Shieldbreaker',
    costumeKo: '타워 크림슨 아우라',
    costumeEn: 'Tower Crimson Aura',
    descriptionKo: '10층 수호자의 방어막을 완전히 분쇄한 실력자',
    descriptionEn: 'Expert who shattered Floor 10 guardian shield',
  },
  {
    floor: 20,
    titleKo: '심연의 지배자',
    titleEn: 'Abyssal Ruler',
    costumeKo: '심연의 보이드 아우라',
    costumeEn: 'Abyssal Void Aura',
    descriptionKo: '20층 심연의 마수들을 굴복시킨 전설의 사령관',
    descriptionEn: 'Legendary commander subduing Floor 20 abyssal beasts',
  },
  {
    floor: 30,
    titleKo: '절대 전술사령관',
    titleEn: 'Grand Tactician',
    costumeKo: '황금 불꽃 절대 아우라',
    costumeEn: 'Golden Flame Absolute Aura',
    descriptionKo: '30층부터 시작되는 극한의 수동 전술을 마스터한 현자',
    descriptionEn: 'Master of high-floor manual tactics beyond Floor 30',
  },
  {
    floor: 50,
    titleKo: '시련의 탑 절대 패왕',
    titleEn: 'Overlord of the Tower',
    costumeKo: '성운의 패왕 풀세트',
    costumeEn: 'Nebula Overlord Full Set',
    descriptionKo: '50층 시련의 탑 정상을 완전 정복한 최강의 패왕',
    descriptionEn: 'Supreme Overlord conquering the 50F Tower pinnacle',
  },
];

export const TowerOfTrialsModal: React.FC<TowerOfTrialsModalProps> = ({
  isOpen,
  onClose,
  language,
  onStartFloor,
  onStartTowerFloor,
}) => {
  const isKo = language === 'ko';
  const [mounted, setMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'floors' | 'rewards'>('floors');

  const [clearedFloor, setClearedFloor] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(TOWER_PROGRESS_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [activeTitle, setActiveTitle] = useState<string>(() => {
    try {
      return localStorage.getItem(TOWER_ACTIVE_TITLE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [unlockedTitles, setUnlockedTitles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(TOWER_TITLES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isSweepOpen, setIsSweepOpen] = useState(false);
  const [isRuneModalOpen, setIsRuneModalOpen] = useState(false);
  const [isHudExpanded, setIsHudExpanded] = useState<boolean>(false);
  const [isActionHubOpen, setIsActionHubOpen] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 모달 열릴 때 최신 로컬스토리지 진행도 갱신
  useEffect(() => {
    if (isOpen) {
      try {
        const savedFloor = parseInt(localStorage.getItem(TOWER_PROGRESS_KEY) || '0', 10);
        setClearedFloor(savedFloor);

        const titles = JSON.parse(localStorage.getItem(TOWER_TITLES_KEY) || '[]');
        setUnlockedTitles(titles);

        const currentActive = localStorage.getItem(TOWER_ACTIVE_TITLE_KEY) || '';
        setActiveTitle(currentActive);
      } catch {
        // fallback
      }
    }
  }, [isOpen]);

  const nextPlayableFloor = Math.min(50, clearedFloor + 1);
  const currentSectorIndex = Math.min(9, Math.floor((Math.max(1, nextPlayableFloor) - 1) / 5));

  // 10개 섹터 (5층 단위) 아코디언 상태 관리 - 현재 도전 구역만 기본 펼침
  const [expandedSectors, setExpandedSectors] = useState<Record<number, boolean>>(() => ({
    [currentSectorIndex]: true
  }));

  // 모달이 열릴 때 현재 도전 구역 자동 펼침 동기화
  useEffect(() => {
    if (isOpen) {
      setExpandedSectors(prev => ({
        ...prev,
        [currentSectorIndex]: true
      }));
    }
  }, [isOpen, currentSectorIndex]);

  const toggleSector = (secIdx: number) => {
    triggerHaptic('light');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setExpandedSectors(prev => ({
      ...prev,
      [secIdx]: !prev[secIdx]
    }));
  };

  const SECTOR_NAMES = [
    { ko: '1구역: 입문 수호자 구역', en: 'Sector 1: Novice Guardians', boss: '5F 아케인 로드' },
    { ko: '2구역: 철벽 방어선 구역', en: 'Sector 2: Iron Rampart', boss: '10F 수호파괴자' },
    { ko: '3구역: 폭풍 전초기지 구역', en: 'Sector 3: Tempest Outpost', boss: '15F 폭풍 인도자' },
    { ko: '4구역: 심연의 회랑 구역', en: 'Sector 4: Abyssal Corridor', boss: '20F 심연 지배자' },
    { ko: '5구역: 홍련 용암로 구역', en: 'Sector 5: Crimson Crucible', boss: '25F 용암 수호령' },
    { ko: '6구역: 절대 전술사령 구역', en: 'Sector 6: Grand Command', boss: '30F 전술사령관' },
    { ko: '7구역: 천상 극천도 구역', en: 'Sector 7: Celestial Zenith', boss: '35F 천상 지배자' },
    { ko: '8구역: 공허 차원단층 구역', en: 'Sector 8: Void Fault', boss: '40F 보이드 파괴자' },
    { ko: '9구역: 태초 신전성 구역', en: 'Sector 9: Primordial Sanctum', boss: '45F 태초 심판관' },
    { ko: '10구역: 패왕 정상 성역', en: 'Sector 10: Overlord Apex', boss: '50F 시련의 패왕' },
  ];

  const floors: FloorData[] = Array.from({ length: 50 }, (_, i) => {
    const fl = i + 1;
    const isBoss = fl % 5 === 0;
    const milestone = MILESTONES.find(m => m.floor === fl);

    return {
      floor: fl,
      modifierKo: fl > 30 
        ? '🚫 수동 전술 전용 (자동전투 불가)' 
        : isBoss 
        ? `👑 ${fl}층 보스 구역: 3턴 분노 광폭화 & 약점 실드` 
        : '⚡ 일반 수호자: 전장 마나 파동 활성화',
      modifierEn: fl > 30 
        ? '🚫 Pure Manual Tactics (Auto Disabled)' 
        : isBoss 
        ? `👑 F${fl} Boss Zone: 3-Turn Fury & Shield` 
        : '⚡ Guardian: Mana Wave Active',
      bossPower: 110 + fl * 14,
      diamondReward: isBoss ? (fl === 50 ? 500 : 50 + fl * 2) : 15,
      isUnlocked: fl <= clearedFloor + 1,
      isCleared: fl <= clearedFloor,
      isBoss,
      milestoneTitleKo: milestone?.titleKo,
      milestoneTitleEn: milestone?.titleEn,
      milestoneCostumeKo: milestone?.costumeKo,
      milestoneCostumeEn: milestone?.costumeEn,
    };
  });

  const handleSelectFloor = (floor: number, isUnlocked: boolean) => {
    if (!isUnlocked) return;
    triggerHaptic('medium');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (onStartFloor) {
      onStartFloor(floor);
    }
    if (onStartTowerFloor) {
      onStartTowerFloor(floor);
    }
    onClose();
  };

  const handleEquipTitle = (title: string) => {
    triggerHaptic('light');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    if (activeTitle === title) {
      localStorage.removeItem(TOWER_ACTIVE_TITLE_KEY);
      setActiveTitle('');
    } else {
      localStorage.setItem(TOWER_ACTIVE_TITLE_KEY, title);
      setActiveTitle(title);
    }
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const content = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs font-mono select-none pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-[#fdfcfc] border border-[#201d1d]/20 rounded-none p-3.5 sm:p-4 text-[#201d1d] shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/15 pb-2.5 mb-2.5 bg-stone-100/70 -mx-3.5 -mt-3.5 px-3.5 pt-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <Trophy size={16} className="text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wider text-[#201d1d] truncate">
              {isKo ? '[🗼 시련의 탑 50F 아레나]' : '[🗼 TOWER OF TRIALS 50F]'}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Action Hub Button */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setIsActionHubOpen(true);
              }}
              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black rounded-sm flex items-center gap-1 cursor-pointer transition active:scale-95"
              title="소탕 및 황금 룬 허브"
            >
              <Zap size={11} className="text-amber-600" />
              <span>{isKo ? '[특수 기능 ▾]' : '[Features ▾]'}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="닫기"
              className="px-2 py-1 text-xs font-bold border border-[#201d1d]/20 hover:bg-[#201d1d] hover:text-white rounded-sm cursor-pointer transition"
            >
              [x]
            </button>
          </div>
        </div>

        {/* Minimal First View: 타워 등반 현황 아코디언 HUD */}
        <div className="bg-white border border-[#201d1d]/15 rounded-sm p-2.5 mb-2.5 shadow-2xs">
          <div
            onClick={() => {
              triggerHaptic('light');
              setIsHudExpanded(!isHudExpanded);
            }}
            className="flex items-center justify-between cursor-pointer hover:opacity-85 transition-opacity gap-2"
          >
            <div className="flex items-center gap-1.5 text-xs font-black text-[#201d1d] min-w-0">
              <Crown size={14} className="text-amber-600 shrink-0" />
              <span className="truncate">
                {isKo ? `[🎯 등반 현황]: ${clearedFloor}층 / 50층` : `[🎯 RECORD]: Floor ${clearedFloor} / 50`}
              </span>
              {!isHudExpanded && (
                <span className="hidden xs:inline text-[10px] font-bold text-slate-500 truncate">
                  (+{clearedFloor * 15} 다이아)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activeTitle && !isHudExpanded && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-xs hidden sm:inline truncate max-w-[100px]">
                  [{activeTitle}]
                </span>
              )}
              <span className="text-[10px] font-bold text-[#646262] bg-[#201d1d]/5 px-2 py-0.5 rounded-xs">
                {isHudExpanded ? (isKo ? '[접기 ▲]' : '[Hide ▲]') : (isKo ? '[상세 ▾]' : '[Details ▾]')}
              </span>
            </div>
          </div>

          {/* HUD 아코디언 펼침 상세 영역 */}
          {isHudExpanded && (
            <div className="pt-2 mt-2 border-t border-[#201d1d]/10 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-600 flex items-center gap-1">
                  <Gem size={12} className="text-cyan-600" />
                  {isKo ? `누적 획득: ${clearedFloor * 15} 다이아` : `Bounty: ${clearedFloor * 15} Gems`}
                </span>
                <span className="text-amber-700 font-mono">
                  {Math.round((clearedFloor / 50) * 100)}% {isKo ? '정복' : 'Cleared'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-100 h-2 border border-[#201d1d]/15 overflow-hidden rounded-xs">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (clearedFloor / 50) * 100)}%` }}
                />
              </div>

              {/* Active Equipped Title */}
              {activeTitle && (
                <div className="flex items-center justify-between text-[10px] bg-amber-50 border border-amber-300 px-2 py-1 rounded-xs">
                  <span className="text-amber-900 font-bold">
                    {isKo ? '👑 현재 장착 대표 칭호:' : '👑 Active Title:'}
                  </span>
                  <span className="font-black text-amber-800">[{activeTitle}]</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2대 메인 서브 탭 (44px+ 터치 타깃) */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setActiveTab('floors');
            }}
            className={`min-h-[44px] py-2 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 rounded-sm border cursor-pointer ${
              activeTab === 'floors'
                ? 'bg-[#201d1d] text-amber-300 border-[#201d1d] shadow-xs'
                : 'bg-white text-stone-700 border-[#201d1d]/15 hover:bg-stone-50'
            }`}
          >
            <Swords size={14} />
            <span>{isKo ? '등반 도전 (50층)' : 'Climb (50F)'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setActiveTab('rewards');
            }}
            className={`min-h-[44px] py-2 px-3 text-xs font-black transition-all flex items-center justify-center gap-1.5 rounded-sm border cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-[#201d1d] text-amber-300 border-[#201d1d] shadow-xs'
                : 'bg-white text-stone-700 border-[#201d1d]/15 hover:bg-stone-50'
            }`}
          >
            <Award size={14} />
            <span>
              {isKo 
                ? `칭호/보상 (${unlockedTitles.length}/${MILESTONES.length})` 
                : `Rewards (${unlockedTitles.length}/${MILESTONES.length})`}
            </span>
          </button>
        </div>

        {/* Tab 1: Floor Ascent with Sector Accordion */}
        {activeTab === 'floors' && (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Quick Ascent 1-Tap CTA Banner */}
            {clearedFloor < 50 && (
              <button
                type="button"
                onClick={() => handleSelectFloor(nextPlayableFloor, true)}
                className="w-full min-h-[44px] py-2 px-3 mb-2 bg-[#201d1d] hover:bg-stone-800 text-amber-300 font-black text-xs uppercase flex items-center justify-between border border-[#201d1d] rounded-sm active:scale-[0.98] transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Flame size={15} className="text-orange-500 fill-orange-500 animate-pulse" />
                  <span>
                    {isKo 
                      ? `[🚀 ${nextPlayableFloor}층 즉시 등반 도전]` 
                      : `[🚀 Resume Floor ${nextPlayableFloor}]`}
                  </span>
                </div>
                <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-xs font-bold">
                  {nextPlayableFloor % 5 === 0 ? '👑 BOSS' : 'BATTLE'} ➔
                </span>
              </button>
            )}

            {/* 5개 층 단위 섹터(Sector) 아코디언 목록 */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2 scrollbar-thin">
              {SECTOR_NAMES.map((sec, secIdx) => {
                const startFl = secIdx * 5 + 1;
                const endFl = (secIdx + 1) * 5;
                const sectorFloors = floors.filter(f => f.floor >= startFl && f.floor <= endFl);
                const isSectorCleared = clearedFloor >= endFl;
                const isSectorCurrent = nextPlayableFloor >= startFl && nextPlayableFloor <= endFl;
                const isSectorLocked = nextPlayableFloor < startFl;
                const isExpanded = !!expandedSectors[secIdx];

                return (
                  <div 
                    key={secIdx}
                    className={`border rounded-sm overflow-hidden transition-all ${
                      isSectorCurrent
                        ? 'border-amber-400/80 bg-amber-50/20'
                        : isSectorCleared
                        ? 'border-emerald-500/30 bg-emerald-50/10'
                        : 'border-[#201d1d]/15 bg-white opacity-85'
                    }`}
                  >
                    {/* Sector Header (Accordion Trigger) */}
                    <div
                      onClick={() => toggleSector(secIdx)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                        isSectorCurrent
                          ? 'bg-amber-100/60 hover:bg-amber-100/90'
                          : isSectorCleared
                          ? 'bg-emerald-50/60 hover:bg-emerald-100/60'
                          : 'bg-stone-50 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black">
                          {isSectorCleared ? '✅' : isSectorCurrent ? '🔥' : '🔒'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#201d1d] truncate">
                              {isKo ? sec.ko : sec.en}
                            </span>
                            <span className="text-[10px] text-stone-500 shrink-0 font-bold">
                              ({startFl}F~{endFl}F)
                            </span>
                          </div>
                          <p className="text-[10px] text-amber-800/80 font-bold truncate">
                            👑 보스: {sec.boss}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-xs ${
                          isSectorCleared
                            ? 'bg-emerald-200 text-emerald-950'
                            : isSectorCurrent
                            ? 'bg-amber-400 text-stone-950 animate-pulse'
                            : 'bg-stone-200 text-stone-600'
                        }`}>
                          {isSectorCleared ? '[완료 ✓]' : isSectorCurrent ? '[도전 중]' : '[잠김]'}
                        </span>
                        <span className="text-xs font-bold text-stone-600">
                          {isExpanded ? '[▲]' : '[▾]'}
                        </span>
                      </div>
                    </div>

                    {/* Sector Expanded Floors */}
                    {isExpanded && (
                      <div className="p-2 space-y-1.5 border-t border-[#201d1d]/10 bg-white">
                        {sectorFloors.map(f => (
                          <div
                            key={f.floor}
                            onClick={() => handleSelectFloor(f.floor, f.isUnlocked)}
                            className={`p-2 rounded-xs border flex items-center justify-between transition-all min-h-[44px] ${
                              f.isCleared
                                ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900'
                                : f.isUnlocked
                                ? f.isBoss
                                  ? 'bg-amber-50 border-amber-400 text-amber-950 cursor-pointer hover:bg-amber-100 ring-1 ring-amber-400'
                                  : 'bg-stone-50 border-[#201d1d]/20 text-stone-900 cursor-pointer hover:bg-stone-100'
                                : 'bg-stone-100/50 border-stone-200 opacity-45 cursor-not-allowed text-stone-400'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="text-center w-11 shrink-0">
                                <span className={`text-xs font-black block ${f.isBoss ? 'text-amber-700' : 'text-stone-900'}`}>
                                  {f.isBoss ? '👑' : ''}F.{f.floor}
                                </span>
                                {f.isBoss && (
                                  <span className="text-[8px] bg-rose-600 text-white px-1 py-0.2 rounded-2xs font-black block">
                                    BOSS
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-stone-900 truncate">
                                  {isKo ? f.modifierKo : f.modifierEn}
                                </div>
                                <div className="text-[9px] text-stone-600 flex items-center gap-1.5 truncate">
                                  <span>PWR {f.bossPower}</span>
                                  <span>|</span>
                                  <span className="text-cyan-700 font-bold">+{f.diamondReward} Gems</span>
                                  {f.milestoneTitleKo && (
                                    <span className="text-amber-800 font-bold">
                                      [{isKo ? f.milestoneTitleKo : f.milestoneTitleEn}]
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {f.isCleared ? (
                                <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1">
                                  <CheckCircle size={12} /> [완료]
                                </span>
                              ) : f.isUnlocked ? (
                                <button
                                  type="button"
                                  className="px-2.5 py-1 bg-[#201d1d] hover:bg-stone-800 text-amber-300 text-[10px] font-black rounded-sm flex items-center gap-1 min-h-[34px] cursor-pointer active:scale-95"
                                >
                                  <Play size={10} /> [도전]
                                </button>
                              ) : (
                                <Lock size={13} className="text-stone-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Milestone Titles & Costumes Catalog */}
        {activeTab === 'rewards' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2 scrollbar-thin">
            <p className="text-[10px] text-stone-600 leading-relaxed border-b border-[#201d1d]/10 pb-1.5">
              {isKo
                ? '5층 단위 보스를 처치할 때마다 영구 칭호와 전술 아우라 코스튬이 해금됩니다. 해금된 칭호는 즉시 대표 칭호로 장착 가능합니다.'
                : 'Defeating every 5th floor boss unlocks permanent titles and tactical aura costumes.'}
            </p>

            {MILESTONES.map(m => {
              const isUnlocked = clearedFloor >= m.floor;
              const titleName = isKo ? m.titleKo : m.titleEn;
              const isEquipped = activeTitle === titleName;

              return (
                <div
                  key={m.floor}
                  className={`p-2.5 border rounded-sm transition-all ${
                    isUnlocked
                      ? 'bg-amber-50/40 border-amber-400/60'
                      : 'bg-stone-50 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-black text-amber-700 shrink-0">[{m.floor}F]</span>
                      <span className="text-xs font-black text-stone-900 truncate">
                        [{titleName}]
                      </span>
                      {m.costumeKo && (
                        <span className="text-[9px] bg-indigo-100 border border-indigo-300 text-indigo-900 px-1 py-0.2 rounded-2xs shrink-0 font-bold">
                          👗 {isKo ? m.costumeKo : m.costumeEn}
                        </span>
                      )}
                    </div>

                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => handleEquipTitle(titleName)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-sm min-h-[32px] cursor-pointer transition-all shrink-0 ${
                          isEquipped
                            ? 'bg-amber-400 text-stone-950 border border-amber-500 font-black'
                            : 'bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        {isEquipped ? (isKo ? '✓ [장착 중]' : '✓ [Active]') : (isKo ? '[장착하기]' : '[Equip]')}
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-500 flex items-center gap-1 shrink-0">
                        <Lock size={11} /> {isKo ? `${m.floor}층 클리어` : `F${m.floor}`}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-stone-600 leading-normal">
                    {isKo ? m.descriptionKo : m.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="pt-2 border-t border-[#201d1d]/15 flex items-center justify-between gap-2">
          <span className="text-[10px] text-stone-500 font-bold">
            {isKo ? `다음 목표: ${nextPlayableFloor}층 보스 돌파` : `Next Target: Floor ${nextPlayableFloor}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#201d1d] hover:bg-stone-800 text-white text-xs font-black uppercase rounded-sm cursor-pointer active:scale-95 transition-all touch-target"
          >
            {isKo ? '[ 닫기 ]' : '[ Close ]'}
          </button>
        </div>
      </motion.div>

      {/* 특수 기능 팝업 허브 (Quick Action Hub Modal) */}
      <AnimatePresence>
        {isActionHubOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000005] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-mono select-none"
            onClick={() => setIsActionHubOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#fdfcfc] border border-[#201d1d]/20 text-[#201d1d] rounded-none max-w-xs w-full shadow-2xl p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-[#201d1d]/15 pb-2">
                <span className="text-xs font-black text-[#201d1d]">
                  {isKo ? '[⚡ 타워 특수 기능 허브]' : '[⚡ TOWER FEATURES]'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsActionHubOpen(false)}
                  className="px-1.5 py-0.5 text-xs font-bold border border-[#201d1d]/20 hover:bg-[#201d1d] hover:text-white rounded-sm"
                >
                  [x]
                </button>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsActionHubOpen(false);
                    triggerHaptic('light');
                    setIsSweepOpen(true);
                  }}
                  disabled={clearedFloor <= 0}
                  className="w-full min-h-[44px] py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-sm flex items-center justify-between cursor-pointer active:scale-98 disabled:opacity-40"
                >
                  <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-600" />
                    <span>{isKo ? '원터치 쾌속 소탕' : 'Quick Sweep'}</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-mono">SWEEP ➔</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsActionHubOpen(false);
                    triggerHaptic('light');
                    setIsRuneModalOpen(true);
                  }}
                  className="w-full min-h-[44px] py-2 px-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-900 text-xs font-bold rounded-sm flex items-center justify-between cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-1.5">
                    <Crown size={14} className="text-yellow-600" />
                    <span>{isKo ? '정복자 황금 룬 패스' : 'Golden Rune'}</span>
                  </div>
                  <span className="text-[10px] text-yellow-700 font-mono">BUFF ➔</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCR-08-05: Tower Instant Sweep Bottom Sheet */}
      <TowerSweepBottomSheet
        isOpen={isSweepOpen}
        onClose={() => setIsSweepOpen(false)}
        maxClearedFloor={clearedFloor}
        language={language}
        onSweepComplete={(floor, count, rewards) => {
          // Update bounty / floor rewards
        }}
      />

      {/* SCR-08-06: Golden Rune Conqueror Pack Modal */}
      <TowerBuffRerollModal
        isOpen={isRuneModalOpen}
        onClose={() => setIsRuneModalOpen(false)}
        language={language}
      />
    </div>
  );

  return createPortal(content, document.body);
};


