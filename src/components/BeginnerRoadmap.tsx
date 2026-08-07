import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Gift, Sparkles, ChevronRight, Lock, Trophy, Award } from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

interface BeginnerRoadmapProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  updateSns: (amount: number, reason?: string) => void;
  playSfx: (url: string) => void;
  userStats?: { wins: number; totalPower?: number };
}

interface RoadmapStep {
  id: number;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  rewardSns: number;
  targetView: ViewType;
  checkCompleted: (stats?: any) => boolean;
}

const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: 1,
    titleKo: '1단계: 내 덱 점검하기',
    titleEn: 'Step 1: Check My Deck',
    descKo: '마이덱 화면으로 이동하여 카드 5장을 구성하세요.',
    descEn: 'Visit My Deck and customize your 5-card battle deck.',
    rewardSns: 100,
    targetView: 'mydeck',
    checkCompleted: () => {
      try {
        const deck = JSON.parse(localStorage.getItem('hero_player_deck') || '[]');
        return Array.isArray(deck) && deck.length >= 5;
      } catch {
        return false;
      }
    }
  },
  {
    id: 2,
    titleKo: '2단계: 카드 첫 강화하기',
    titleEn: 'Step 2: Upgrade a Card',
    descKo: '마이덱에서 카드의 레벨이나 스킬을 1회 강화하세요.',
    descEn: 'Upgrade any card level or skill in My Deck.',
    rewardSns: 150,
    targetView: 'mydeck',
    checkCompleted: () => {
      try {
        const inv = JSON.parse(localStorage.getItem('hero_inventory') || '{}');
        return Object.values(inv).some((item: any) => (item?.level || 1) > 1);
      } catch {
        return false;
      }
    }
  },
  {
    id: 3,
    titleKo: '3단계: 첫 전투 승리하기',
    titleEn: 'Step 3: Win First Battle',
    descKo: '연습장이나 스토리 모드에서 1회 승리하세요.',
    descEn: 'Win 1 match in Training Ground or Story Mode.',
    rewardSns: 200,
    targetView: 'play',
    checkCompleted: (stats) => (stats?.wins || 0) >= 1
  },
  {
    id: 4,
    titleKo: '4단계: 카드 팩 소환하기',
    titleEn: 'Step 4: Open Card Pack',
    descKo: '상점에서 신규 카드 팩을 1회 뽑으세요.',
    descEn: 'Summon 1 card pack in the Shop.',
    rewardSns: 250,
    targetView: 'shop',
    checkCompleted: () => {
      try {
        return localStorage.getItem('hero_shop_pack_opened') === 'true';
      } catch {
        return false;
      }
    }
  },
  {
    id: 5,
    titleKo: '5단계: 장비 장착하기',
    titleEn: 'Step 5: Equip an Item',
    descKo: '카드 1장에 목걸이나 반지 장비를 장착하세요.',
    descEn: 'Equip any necklace or ring item onto a card.',
    rewardSns: 300,
    targetView: 'mydeck',
    checkCompleted: () => {
      try {
        const deck = JSON.parse(localStorage.getItem('hero_player_deck') || '[]');
        return deck.some((c: any) => c?.equipment && Object.keys(c.equipment).length > 0);
      } catch {
        return false;
      }
    }
  },
  {
    id: 6,
    titleKo: '6단계: RPG 에코즈 탐험',
    titleEn: 'Step 6: Explore Kadan RPG',
    descKo: '카단 & 아케인 에코즈 RPG 모드에 진입하세요.',
    descEn: 'Enter Kadan & Arcane Echoes RPG mode.',
    rewardSns: 350,
    targetView: 'main',
    checkCompleted: () => {
      try {
        return localStorage.getItem('hero_kadan_rpg_visited') === 'true';
      } catch {
        return false;
      }
    }
  },
  {
    id: 7,
    titleKo: '7단계: 3승 전설 달성',
    titleEn: 'Step 7: Achieve 3 Wins',
    descKo: '총 통산 승수 3승을 달성하여 초보자 로드맵을 완료하세요!',
    descEn: 'Reach 3 total wins to master the Beginner Roadmap!',
    rewardSns: 500,
    targetView: 'play',
    checkCompleted: (stats) => (stats?.wins || 0) >= 3
  }
];

export const BeginnerRoadmap: React.FC<BeginnerRoadmapProps> = ({
  language,
  onNavigate,
  updateSns,
  playSfx,
  userStats
}) => {
  const [claimedSteps, setClaimedSteps] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('hero_beginner_roadmap_claimed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('hero_beginner_roadmap_claimed', JSON.stringify(claimedSteps));
  }, [claimedSteps]);

  const isStepCompleted = (step: RoadmapStep) => step.checkCompleted(userStats);

  const handleClaim = (step: RoadmapStep) => {
    if (claimedSteps.includes(step.id)) return;
    if (!isStepCompleted(step)) {
      onNavigate(step.targetView);
      return;
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    updateSns(step.rewardSns, `초보자 로드맵 ${step.id}단계 완료 보상`);
    setClaimedSteps(prev => [...prev, step.id]);
  };

  const completedCount = ROADMAP_STEPS.filter(s => isStepCompleted(s)).length;
  const totalSteps = ROADMAP_STEPS.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  if (claimedSteps.length === totalSteps) {
    return null; // Hide widget if all claimed
  }

  return (
    <div className="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-4 sm:p-5 font-mono my-2 shadow-sm relative overflow-hidden">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.1)] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-sm bg-amber-500 text-black font-black flex items-center justify-center text-xs shadow-sm">
            <Trophy size={14} />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase text-[#201d1d] flex items-center gap-1.5">
              {language === 'ko' ? '초보자 성장 로드맵' : 'Beginner Roadmap'}
              <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-sm border border-rose-300">
                {completedCount}/{totalSteps}
              </span>
            </h3>
            <p className="text-[10px] text-gray-500">
              {language === 'ko' ? '미션을 완료하고 총 1,850 SNS 토큰 보상을 획득하세요!' : 'Complete missions to earn 1,850 SNS Tokens!'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold px-2 py-1 bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors rounded-sm"
        >
          {isOpen ? (language === 'ko' ? '접기' : 'Hide') : (language === 'ko' ? '펼치기' : 'Expand')}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-bold mb-1 text-gray-600">
          <span>{language === 'ko' ? '달성 진행도' : 'Progress'}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-none overflow-hidden border border-gray-300">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      {isOpen && (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {ROADMAP_STEPS.map((step) => {
            const completed = isStepCompleted(step);
            const claimed = claimedSteps.includes(step.id);

            return (
              <div
                key={step.id}
                className={cn(
                  "p-3 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 transition-all",
                  claimed ? "bg-gray-50 border-gray-200 opacity-60" :
                  completed ? "bg-amber-50/60 border-amber-300 shadow-sm" :
                  "bg-white border-gray-200"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={cn(
                    "w-6 h-6 rounded-sm flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
                    claimed ? "bg-gray-300 text-gray-600" :
                    completed ? "bg-emerald-500 text-white" :
                    "bg-gray-100 text-gray-700 border border-gray-300"
                  )}>
                    {claimed ? <CheckCircle2 size={14} /> : step.id}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-gray-900 truncate">
                        {language === 'ko' ? step.titleKo : step.titleEn}
                      </span>
                      <span className="text-[10px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded-sm shrink-0">
                        +{step.rewardSns} SNS
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                      {language === 'ko' ? step.descKo : step.descEn}
                    </p>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  {claimed ? (
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 py-1 bg-gray-100 border border-gray-200 rounded-sm">
                      {language === 'ko' ? '수령 완료' : 'Claimed'}
                    </span>
                  ) : completed ? (
                    <button
                      onClick={() => handleClaim(step)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-sm active:scale-95 transition-transform flex items-center gap-1 shadow-sm"
                    >
                      <Gift size={12} />
                      <span>{language === 'ko' ? '보상 수령' : 'Claim'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClaim(step)}
                      className="px-3 py-1.5 bg-[#201d1d] hover:bg-black text-white font-black text-xs rounded-sm active:scale-95 transition-transform flex items-center gap-1"
                    >
                      <span>{language === 'ko' ? '바로 가기' : 'Go'}</span>
                      <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
