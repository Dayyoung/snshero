import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, X, Shield, Swords, Gem, Award, Lock, Play, Flame, CheckCircle, Shirt, Crown } from 'lucide-react';
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

  const nextPlayableFloor = Math.min(50, clearedFloor + 1);

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
      // 해제
      localStorage.removeItem(TOWER_ACTIVE_TITLE_KEY);
      setActiveTitle('');
    } else {
      localStorage.setItem(TOWER_ACTIVE_TITLE_KEY, title);
      setActiveTitle(title);
    }
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const content = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono select-none pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-[#181515] border border-[rgba(255,255,255,0.2)] rounded-none p-3.5 sm:p-4 text-[#fdfcfc] shadow-2xl max-h-[90vh] flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            <Trophy size={16} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              [ TOWER OF TRIALS (50 FLOORS) ]
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-white/60 hover:text-white p-1 rounded-sm border border-transparent hover:border-white/20 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top Progress & Reward Summary HUD */}
        <div className="bg-[#120f0f] border border-white/10 p-2.5 rounded-none mb-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-300 flex items-center gap-1.5">
              <Crown size={14} className="text-amber-400" />
              {isKo ? `최고 정복: ${clearedFloor}층 / 50층` : `Record: Floor ${clearedFloor} / 50`}
            </span>
            <span className="text-cyan-300 flex items-center gap-1 text-[11px]">
              <Gem size={12} />
              {isKo ? `누적 획득: ${clearedFloor * 15} 다이아` : `Bounty: ${clearedFloor * 15} Gems`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-black/60 h-2 border border-white/15 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (clearedFloor / 50) * 100)}%` }}
            />
          </div>

          {/* Active Equipped Title */}
          {activeTitle && (
            <div className="flex items-center justify-between text-[10px] bg-amber-950/40 border border-amber-500/40 px-2 py-1">
              <span className="text-amber-200">
                {isKo ? '👑 현재 장착 대표 칭호:' : '👑 Active Title:'}
              </span>
              <span className="font-bold text-amber-300">[{activeTitle}]</span>
            </div>
          )}
        </div>

        {/* SCR-08-05 & SCR-08-06 Quick Action Bar (44px+ touch targets) */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsSweepOpen(true);
            }}
            disabled={clearedFloor <= 0}
            className="min-h-[44px] py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 text-xs font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer active:scale-98 disabled:opacity-40"
          >
            <Zap size={14} className="text-amber-400" />
            <span>{isKo ? '⚡ 원터치 쾌속 소탕' : '⚡ Quick Sweep'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsRuneModalOpen(true);
            }}
            className="min-h-[44px] py-1.5 px-2 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/50 text-yellow-300 text-xs font-bold rounded-none flex items-center justify-center gap-1 cursor-pointer active:scale-98"
          >
            <Crown size={14} className="text-yellow-400" />
            <span>{isKo ? '👑 정복자 황금 룬' : '👑 Golden Rune'}</span>
          </button>
        </div>

        {/* Sub Navigation Tab Bar (44px+ 터치 타깃) */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('floors')}
            className={`min-h-[44px] py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
              activeTab === 'floors'
                ? 'bg-amber-400 text-[#181515] border-amber-300 shadow-xs'
                : 'bg-[#221e1e] text-white/70 border-white/10 hover:bg-[#2c2626]'
            }`}
          >
            <Swords size={14} />
            <span>{isKo ? '등반 도전 (50층)' : 'Climb (50F)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`min-h-[44px] py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
              activeTab === 'rewards'
                ? 'bg-amber-400 text-[#181515] border-amber-300 shadow-xs'
                : 'bg-[#221e1e] text-white/70 border-white/10 hover:bg-[#2c2626]'
            }`}
          >
            <Award size={14} />
            <span>
              {isKo 
                ? `한정 칭호/코스튬 (${unlockedTitles.length}/${MILESTONES.length})` 
                : `Rewards (${unlockedTitles.length}/${MILESTONES.length})`}
            </span>
          </button>
        </div>

        {/* Tab 1: Floor Ascent List */}
        {activeTab === 'floors' && (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Quick Ascent 1-Tap CTA Banner */}
            {clearedFloor < 50 && (
              <button
                type="button"
                onClick={() => handleSelectFloor(nextPlayableFloor, true)}
                className="w-full min-h-[44px] py-2.5 px-3 mb-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-[#181515] font-black text-xs uppercase flex items-center justify-between border border-amber-300 active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-1.5">
                  <Flame size={16} className="text-red-950 animate-bounce" />
                  <span>
                    {isKo 
                      ? `[🚀 ${nextPlayableFloor}층 즉시 등반 시작]` 
                      : `[🚀 Resume Floor ${nextPlayableFloor}]`}
                  </span>
                </div>
                <span className="text-[10px] bg-[#181515] text-amber-300 px-2 py-0.5 font-bold">
                  {nextPlayableFloor % 5 === 0 ? '👑 BOSS' : 'BATTLE'} ➔
                </span>
              </button>
            )}

            {/* Scrollable Floor List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mb-2 scrollbar-thin">
              {floors.slice(0, Math.min(50, clearedFloor + 6)).map(f => (
                <div
                  key={f.floor}
                  onClick={() => handleSelectFloor(f.floor, f.isUnlocked)}
                  className={`p-2.5 rounded-none border flex items-center justify-between transition-all min-h-[44px] ${
                    f.isCleared
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : f.isUnlocked
                      ? f.isBoss
                        ? 'bg-amber-950/60 border-amber-400 text-amber-100 cursor-pointer hover:bg-amber-900/60 ring-1 ring-amber-500/40'
                        : 'bg-[#221e1e] border-amber-400/60 text-amber-200 cursor-pointer hover:bg-amber-950/40'
                      : 'bg-[#141212]/50 border-white/10 opacity-40 cursor-not-allowed text-white/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="text-center w-11">
                      <span className={`text-xs font-black block ${f.isBoss ? 'text-amber-400' : 'text-white'}`}>
                        {f.isBoss ? '👑' : ''}F.{f.floor}
                      </span>
                      {f.isBoss && (
                        <span className="text-[8px] bg-rose-950 border border-rose-600 text-rose-300 px-1 py-0.2 block">
                          BOSS
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-white/90">
                        {isKo ? f.modifierKo : f.modifierEn}
                      </div>
                      <div className="text-[9px] text-white/60 flex items-center gap-2">
                        <span>PWR {f.bossPower}</span>
                        <span>|</span>
                        <span className="text-cyan-300 font-bold">+{f.diamondReward} Gems</span>
                        {f.milestoneTitleKo && (
                          <span className="text-amber-300 font-bold">
                            [{isKo ? f.milestoneTitleKo : f.milestoneTitleEn}]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {f.isCleared ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> [완료]
                      </span>
                    ) : f.isUnlocked ? (
                      <button
                        type="button"
                        className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#181515] text-[10px] font-black rounded-none flex items-center gap-1 min-h-[32px] cursor-pointer active:scale-95"
                      >
                        <Play size={10} /> [도전]
                      </button>
                    ) : (
                      <Lock size={14} className="text-white/30" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Milestone Titles & Costumes Catalog */}
        {activeTab === 'rewards' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2 scrollbar-thin">
            <p className="text-[10px] text-white/70 leading-relaxed border-b border-white/10 pb-1.5">
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
                  className={`p-2.5 border transition-all ${
                    isUnlocked
                      ? 'bg-[#221e1e] border-amber-500/60'
                      : 'bg-[#141212]/60 border-white/10 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-amber-400">[{m.floor}F]</span>
                      <span className="text-xs font-bold text-white">
                        [{titleName}]
                      </span>
                      {m.costumeKo && (
                        <span className="text-[9px] bg-indigo-950 border border-indigo-500 text-indigo-300 px-1 py-0.2">
                          👗 {isKo ? m.costumeKo : m.costumeEn}
                        </span>
                      )}
                    </div>

                    {isUnlocked ? (
                      <button
                        type="button"
                        onClick={() => handleEquipTitle(titleName)}
                        className={`px-2.5 py-1 text-[10px] font-bold min-h-[32px] cursor-pointer transition-all ${
                          isEquipped
                            ? 'bg-amber-400 text-[#181515] border border-amber-300'
                            : 'bg-black/50 text-white/80 border border-white/20 hover:bg-white/10'
                        }`}
                      >
                        {isEquipped ? (isKo ? '✓ [장착 중]' : '✓ [Active]') : (isKo ? '[장착하기]' : '[Equip]')}
                      </button>
                    ) : (
                      <span className="text-[10px] text-white/40 flex items-center gap-1">
                        <Lock size={11} /> {isKo ? `${m.floor}층 클리어 필요` : `Reach Floor ${m.floor}`}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-white/70 leading-normal">
                    {isKo ? m.descriptionKo : m.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Close Button (44px+) */}
        <button
          onClick={onClose}
          className="w-full min-h-[44px] py-2.5 bg-[#fdfcfc] text-[#181515] hover:bg-amber-300 transition-colors text-xs font-black uppercase rounded-none flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 shadow-md"
        >
          <Sparkles size={14} />
          <span>{isKo ? '[ 닫기 ]' : '[ Close ]'}</span>
        </button>
      </motion.div>

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

