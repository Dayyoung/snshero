import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Lock,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight,
  Gift,
  Sparkles,
  ShieldCheck,
  Coins,
  RotateCcw,
  Flame,
  Droplets,
  Mountain,
  Wind,
  Shield,
  Layers,
  Sparkle,
} from 'lucide-react';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { Skill, Language, ViewType, CardData } from '../types';
import { t } from '../lib/i18n';
import { INITIAL_SKILLS, getSkillTier, getRequiredLevelForSkill } from '../constants';
import { PageHeader } from '../components/PageHeader';
import { getSkillResetCost, getSkillUpgradeCost } from '../content/snsEconomy';

interface SkillViewProps {
  skills: Skill[];
  language: Language;
  onNavigate: (view: ViewType) => void;
  onUpgradeSkill: (skillId: string) => void;
  onResetSkills: () => void;
  onBack?: () => void;
  companionLevel: number;
  skillPoints: number;
  sns: number;
  isImpersonating?: boolean;
  selectedCard?: CardData | null;
  cardId?: string;
  allCards?: CardData[];
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Zap,
  Lock,
  ArrowUp,
  ArrowDown,
  ArrowLeft: ArrowLeftIcon,
  ArrowRight,
  Gift,
  Sparkles,
  ShieldCheck,
};

const HELP_STEPS = [
  {
    key: 'skill_help_upgrade',
    descKey: 'skill_help_upgrade_desc',
    title: { ko: '스킬 강화 안내', en: 'Skill Upgrade Guide' },
    desc: {
      ko: '소지한 SNS 포인트를 소모하여 스킬을 강화할 수 있습니다. 레벨이 오를수록 효과 수치가 증가합니다.',
      en: 'Spend SNS points to upgrade skills. Higher levels provide stronger stat boosts.',
    },
  },
  {
    key: 'skill_help_reset',
    descKey: 'skill_help_reset_desc',
    title: { ko: '스킬 초기화 안내', en: 'Skill Reset Guide' },
    desc: {
      ko: '스킬 초기화 진행 시 투자했던 모든 스킬 포인트가 반환되며, 스킬이 초기 상태로 되돌아갑니다.',
      en: 'Resetting skills returns all invested points and resets skills to initial levels.',
    },
  },
  {
    key: 'skill_help_points',
    descKey: 'skill_help_points_desc',
    title: { ko: '티어 및 조건 안내', en: 'Tiers & Requirements Guide' },
    desc: {
      ko: '동반자(Companion) 레벨 조건에 따라 차례대로 고티어 스킬이 해금됩니다.',
      en: 'Higher tier skills unlock as your Companion level increases.',
    },
  },
];

const cleanSkillName = (name: string) => name.replace(/\s+[IVX]+$/, '');

const getElementInfo = (element?: string) => {
  switch (element) {
    case 'fire':
      return { label: 'FIRE', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: Flame };
    case 'water':
      return { label: 'WATER', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', icon: Droplets };
    case 'earth':
      return { label: 'EARTH', bg: 'bg-amber-600/20 text-amber-300 border-amber-500/40', icon: Mountain };
    case 'wind':
      return { label: 'WIND', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: Wind };
    default:
      return { label: 'NEUTRAL', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Zap };
  }
};

export const SkillView: React.FC<SkillViewProps> = ({
  skills,
  language,
  onNavigate,
  onUpgradeSkill,
  onResetSkills,
  onBack,
  companionLevel,
  skillPoints,
  sns,
  isImpersonating = false,
  selectedCard,
  cardId,
  allCards = [],
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [upgradingSkillId, setUpgradingSkillId] = useState<string | null>(null);

  // Batch Select & Upgrade Plan Calculation (Row 27)
  const affordableUpgrades = useMemo(() => {
    let remainingSns = sns;
    const upgradePlan: { skillId: string; count: number; totalCost: number }[] = [];
    const simulatedLevels: Record<string, number> = {};
    skills.forEach(s => { simulatedLevels[s.id] = s.level || 0; });

    let found = true;
    while (found) {
      found = false;
      for (const skill of skills) {
        const baseSkill = INITIAL_SKILLS.find(s => s.id === skill.id) || skill;
        const requiredLvl = baseSkill.requiredLevel || 0;
        const isLocked = companionLevel < requiredLvl;
        const maxLvl = skill.maxLevel || 5;
        const curLvl = simulatedLevels[skill.id] || 0;
        if (!isLocked && curLvl < maxLvl) {
          const cost = getSkillUpgradeCost(curLvl);
          if (remainingSns >= cost) {
            remainingSns -= cost;
            simulatedLevels[skill.id] = curLvl + 1;
            const plan = upgradePlan.find(p => p.skillId === skill.id);
            if (plan) {
              plan.count += 1;
              plan.totalCost += cost;
            } else {
              upgradePlan.push({ skillId: skill.id, count: 1, totalCost: cost });
            }
            found = true;
          }
        }
      }
    }
    const totalCount = upgradePlan.reduce((acc, p) => acc + p.count, 0);
    const totalCost = upgradePlan.reduce((acc, p) => acc + p.totalCost, 0);
    return { upgradePlan, totalCount, totalCost, simulatedLevels };
  }, [skills, sns, companionLevel]);

  const handleBatchUpgrade = () => {
    if (affordableUpgrades.totalCount === 0) return;
    affordableUpgrades.upgradePlan.forEach(plan => {
      for (let i = 0; i < plan.count; i++) {
        onUpgradeSkill(plan.skillId);
      }
    });
    try {
      new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3').play().catch(() => {});
    } catch {}
  };

  // Target card context (from props or URL query ?cardId=)
  const targetCard = useMemo(() => {
    if (selectedCard) return selectedCard;
    if (cardId && allCards && allCards.length > 0) {
      return allCards.find(c => String(c.id) === String(cardId) || String(c.imageIndex) === String(cardId)) || null;
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qCardId = params.get('cardId');
      if (qCardId && allCards && allCards.length > 0) {
        return allCards.find(c => String(c.id) === String(qCardId) || String(c.imageIndex) === String(qCardId)) || null;
      }
    }
    return null;
  }, [selectedCard, cardId, allCards]);

  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (helpOpen) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [helpOpen]);

  const [helpStep, setHelpStep] = useState(0);

  const isAdmin = isImpersonating;
  const cost = isAdmin ? 0 : getSkillResetCost();

  // Total skills level summary
  const totalSkillLevels = skills.reduce((acc, s) => acc + (s.level || 0), 0);
  const currentTier = getSkillTier(totalSkillLevels);

  const handleBack = onBack || (() => onNavigate('mydeck'));

  const handleResetConfirm = () => {
    onResetSkills();
    setShowResetConfirm(false);
  };

  const targetCardIdNum = targetCard
    ? (targetCard.imageIndex !== undefined ? targetCard.imageIndex : (Number(targetCard.id) || 1))
    : 1;

  const targetCardTitle = targetCard
    ? (language === 'ko'
        ? (targetCard.title || targetCard.title_dis || '영웅')
        : (targetCard.title_en || targetCard.title_dis || targetCard.title || 'Hero'))
    : null;

  const targetCardPower = targetCard
    ? (targetCard.power || (targetCard.stats ? targetCard.stats.reduce((a, b) => a + b, 0) : 100))
    : 0;

  const elementInfo = getElementInfo(targetCard?.element);
  const ElementIcon = elementInfo.icon;

  return (
    <div id="skill-tree" className="p-4 md:p-8 pb-32 max-w-4xl mx-auto min-h-screen text-slate-800 font-sans">
      <PageHeader
        title={t('skills', language)}
        onBack={handleBack}
        rightAction={
          <button
            type="button"
            onClick={() => {
              setHelpOpen(true);
              setHelpStep(0);
            }}
            className="w-9 h-9 rounded-full border border-slate-300 bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <HelpCircle size={18} />
          </button>
        }
      />

      {/* ─── 대상 카드 정보 배너 (Target Card Context Banner - Row 6/ID 6) ─── */}
      {targetCard && (
        <div className="my-4 rounded-xl border border-indigo-500/30 bg-slate-900 p-4 text-white shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-13 h-13 rounded-lg border-2 border-indigo-400/60 bg-slate-950 shrink-0 relative overflow-hidden shadow-inner"
              style={getCardSpriteStyle(targetCardIdNum)}
            >
              {targetCard.rarity && (
                <span className="absolute top-0 right-0 bg-indigo-600 text-white font-mono font-black text-[8px] px-1 py-0.5 rounded-bl-sm">
                  {targetCard.rarity}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded border border-indigo-500/30">
                  {language === 'ko' ? '강화 대상 히어로' : 'TARGET HERO'}
                </span>
                <span className={cn('text-[9px] font-black uppercase px-1.5 py-0.5 rounded border flex items-center gap-1', elementInfo.bg)}>
                  <ElementIcon size={10} />
                  <span>{elementInfo.label}</span>
                </span>
              </div>
              <h2 className="text-base font-black text-white truncate mt-1">
                {targetCardTitle}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                <span>Lv. {targetCard.level || companionLevel}</span>
                <span>•</span>
                <span className="text-amber-400 font-bold">POW {targetCardPower}⚡</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end shrink-0 text-right font-mono">
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              {language === 'ko' ? '스킬 레벨 보너스' : 'SKILL LEVEL BONUS'}
            </span>
            <span className="text-sm font-black text-amber-300">
              Lv. {totalSkillLevels} / {skills.length * 5}
            </span>
          </div>
        </div>
      )}

      {/* ─── 상단 요약 대시보드 배너 (Summary Dashboard Banner) ─── */}
      <div className="my-4 rounded-2xl border border-slate-900/10 bg-slate-950 p-5 text-white shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* 포인트 & 티어 정보 */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-400 shadow-inner">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {language === 'ko' ? '스킬 상태' : 'SKILL STATUS'}
                </span>
                <span className="rounded-md border border-indigo-400/30 bg-indigo-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300">
                  TIER {currentTier}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Lv. {totalSkillLevels}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ({skills.length} {language === 'ko' ? '개 스킬 보유' : 'skills active'})
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-300 font-bold">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/30">
                  {language === 'ko' ? '적용 대상: 전체 덱 & 동반자 히어로' : 'Target: All Deck Cards & Companion'}
                </span>
              </div>
            </div>
          </div>

          {/* 보유 SNS & 일괄 강화 & 초기화 버튼 */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2">
              <Coins size={16} className="text-amber-400" />
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'ko' ? '보유 SNS' : 'SNS BALANCE'}
                </p>
                <p className="font-mono text-sm font-black text-amber-300">
                  {sns.toLocaleString()} SNS
                </p>
              </div>
            </div>

            {/* Row 27: Smart Batch Upgrade All Button */}
            <button
              type="button"
              disabled={affordableUpgrades.totalCount === 0}
              onClick={handleBatchUpgrade}
              className={cn(
                "flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-md cursor-pointer",
                affordableUpgrades.totalCount > 0
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 border border-amber-300 shadow-amber-500/20"
                  : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none"
              )}
              title={
                affordableUpgrades.totalCount > 0
                  ? language === 'ko'
                    ? `가능한 모든 스킬 ${affordableUpgrades.totalCount}회 일괄 강화 (소모: ${affordableUpgrades.totalCost.toLocaleString()} SNS)`
                    : `Batch upgrade ${affordableUpgrades.totalCount} levels for ${affordableUpgrades.totalCost.toLocaleString()} SNS`
                  : language === 'ko'
                  ? '강화 가능한 스킬이 없습니다.'
                  : 'No affordable upgrades available'
              }
            >
              <Sparkles size={14} className={affordableUpgrades.totalCount > 0 ? "animate-pulse" : ""} />
              <span>{language === 'ko' ? '일괄 강화' : 'BATCH UPGRADE'}</span>
              {affordableUpgrades.totalCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-slate-950/20 text-slate-950 font-extrabold text-[10px]">
                  +{affordableUpgrades.totalCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>{language === 'ko' ? '스킬 초기화' : 'RESET'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 스킬 트리 연결선 SVG (Skill Tree Connector Lines - ID 85) ─── */}
      <div className="relative mb-6">
        <svg className="w-full h-12 overflow-visible hidden md:block">
          <defs>
            <linearGradient id="unlockedLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          {skills.slice(0, -1).map((sk, idx) => {
            const isUnlocked = (sk.level || 0) > 0;
            const startX = `${((idx + 0.5) / skills.length) * 100}%`;
            const endX = `${((idx + 1.5) / skills.length) * 100}%`;
            return (
              <g key={`conn-${idx}`}>
                <line
                  x1={startX}
                  y1="24"
                  x2={endX}
                  y2="24"
                  stroke={isUnlocked ? "url(#unlockedLineGrad)" : "#e2e8f0"}
                  strokeWidth={isUnlocked ? "4" : "2"}
                  strokeDasharray={isUnlocked ? "none" : "6 4"}
                  className={isUnlocked ? "animate-pulse drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" : ""}
                />
                <circle
                  cx={startX}
                  cy="24"
                  r="5"
                  fill={isUnlocked ? "#f59e0b" : "#cbd5e1"}
                  className={isUnlocked ? "animate-ping opacity-75" : ""}
                />
              </g>
            );
          })}
        </svg>

        {/* ─── 스킬 카드 그리드 (Skill Cards Grid) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => {
          const baseSkill = INITIAL_SKILLS.find((s) => s.id === skill.id) || skill;
          const maxLvl = baseSkill.maxLevel || 5;
          const currentLvl = skill.level || 0;
          const isMaxLevel = currentLvl >= maxLvl;

          const requiredLvl = baseSkill.requiredLevel || 0;
          const isLocked = companionLevel < requiredLvl;

          const upgradeCost = getSkillUpgradeCost(currentLvl);
          const canAfford = sns >= upgradeCost || isImpersonating;

          const displayName = cleanSkillName(
            language === 'ko' ? baseSkill.name || skill.name : baseSkill.name_en || skill.name_en
          );
          const description =
            language === 'ko'
              ? baseSkill.description || skill.description
              : baseSkill.description_en || skill.description_en;

          const IconComponent = iconMap[baseSkill.icon] || Zap;

          // 효과 수치 계산
          const effectType = baseSkill.effect?.type || 'power';
          const baseVal = baseSkill.effect?.value || 0.05;
          const currentEffectVal = baseVal * currentLvl;
          const nextEffectVal = baseVal * (currentLvl + 1);

          const formatEffectLabel = (val: number) => {
            if (effectType.startsWith('stat')) {
              return `+${val}`;
            }
            return `+${(val * 100).toFixed(0)}%`;
          };

          return (
            <div
              key={skill.id}
              className={cn(
                'relative flex flex-col justify-between rounded-xl border-2 p-5 shadow-lg transition-all duration-300',
                isLocked
                  ? 'border-slate-200 bg-slate-50/80 opacity-75'
                  : isMaxLevel
                  ? 'border-amber-300/80 bg-gradient-to-br from-amber-50/40 via-white to-amber-100/30'
                  : 'border-slate-900/80 bg-white hover:border-indigo-600/80'
              )}
            >
              <div>
                {/* 카드 상단: 아이콘 + 이름 + 레벨 도트 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-inner',
                        isLocked
                          ? 'border-slate-300 bg-slate-200 text-slate-500'
                          : isMaxLevel
                          ? 'border-amber-400 bg-amber-500 text-white shadow-amber-500/30'
                          : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600'
                      )}
                    >
                      {isLocked ? <Lock size={22} /> : <IconComponent size={22} />}
                    </div>

                    <div>
                      <h3 className="font-mono text-base font-black tracking-tight text-slate-900">
                        {displayName}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500">
                          Lv.{currentLvl} / {maxLvl}
                        </span>
                        {isMaxLevel && (
                          <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                            MAX
                          </span>
                        )}
                        {isLocked && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            {language === 'ko' ? `동반자 Lv.${requiredLvl} 필요` : `Companion Lv.${requiredLvl} Req.`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 레벨 프로그레스 도트 게이지 (5단계 시각화) */}
                <div className="mt-3.5 flex gap-1.5">
                  {Array.from({ length: maxLvl }).map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'h-2 flex-1 rounded-full transition-all duration-300',
                        idx < currentLvl
                          ? isMaxLevel
                            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                            : 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]'
                          : 'bg-slate-200'
                      )}
                    />
                  ))}
                </div>

                {/* 스킬 설명 */}
                <p className="mt-3.5 text-xs font-semibold leading-relaxed text-slate-600">
                  {description}
                </p>

                {/* 1-Line Consolidated Skill Node Action Control Bar (ID 245) */}
                <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 pl-3">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 min-w-0">
                    {!isMaxLevel && !isLocked ? (
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-extrabold text-indigo-700 truncate">
                        [Cost: {upgradeCost.toLocaleString()} SNS | LV {currentLvl} ➔ {currentLvl + 1}]
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold">[LV {currentLvl}/{maxLvl}]</span>
                    )}
                  </div>

                  <button
                    disabled={isMaxLevel || isLocked || (!canAfford && !isImpersonating)}
                    onClick={() => {
                      onUpgradeSkill(skill.id);
                      setUpgradingSkillId(skill.id);
                      try {
                        new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(() => {});
                      } catch {}
                      setTimeout(() => setUpgradingSkillId(null), 1000);
                    }}
                    id={`skill-upgrade-${skill.id}`}
                    className={cn(
                      'px-3.5 py-2 rounded-md font-mono text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0',
                      isMaxLevel
                        ? 'bg-amber-500 text-white border border-amber-400 cursor-default'
                        : isLocked
                        ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                        : !canAfford
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-indigo-600/30'
                    )}
                  >
                    {isMaxLevel ? (
                      <span>{language === 'ko' ? '최대' : 'MAX'}</span>
                    ) : isLocked ? (
                      <span>{language === 'ko' ? '잠김' : 'LOCKED'}</span>
                    ) : (
                      <>
                        <Zap size={13} />
                        <span>{language === 'ko' ? '강화' : 'UPGRADE'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ID 103/107/115: Glow & Sparkle FX Overlay on Skill Node Upgrade */}
              {upgradingSkillId === skill.id && (
                <div className="absolute inset-0 z-50 rounded-xl pointer-events-none overflow-hidden flex flex-col items-center justify-center bg-amber-400/20 backdrop-blur-[1px] animate-pulse">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 blur-md animate-ping opacity-80" />
                  <div className="absolute flex items-center justify-center gap-1 bg-amber-500 text-slate-950 font-mono font-black text-xs px-3 py-1 rounded-full shadow-2xl border border-white">
                    <Sparkles size={16} className="text-white animate-spin" />
                    <span>UPGRADE SUCCESS!</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {/* ─── 스킬 초기화 확인 모달 ─── */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white/95 backdrop-blur-md border border-slate-100 p-6 sm:p-8 rounded-lg max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center gap-4 text-rose-600">
                <AlertTriangle size={28} />
                <h3 className="text-xl font-bold uppercase tracking-tight">
                  {language === 'ko' ? '초기화 프로토콜' : 'RESET PROTOCOL'}
                </h3>
              </div>

              <p className="text-sm font-medium leading-relaxed text-slate-600 whitespace-pre-line">
                {language === 'ko'
                  ? `정말로 모든 스킬을 초기화하시겠습니까?\n비용: ${cost} SNS\n(투자된 모든 스킬 포인트가 반환됩니다)`
                  : `Are you sure you want to reset ALL skills?\nCost: ${cost} SNS\n(All invested points will be returned)`}
              </p>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 font-semibold uppercase rounded-xl hover:bg-slate-50 transition-all text-sm cursor-pointer"
                >
                  {language === 'ko' ? '취소' : 'CANCEL'}
                </button>
                <button
                  onClick={handleResetConfirm}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold uppercase rounded-xl shadow-md shadow-rose-500/10 transition-all text-sm cursor-pointer"
                >
                  {language === 'ko' ? '확인' : 'CONFIRM'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 도움말 팝업 ─── */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>

              <div className="text-center mb-5">
                <HelpCircle size={24} className="mx-auto text-indigo-500 mb-2" />
                <h3 className="text-sm font-black text-slate-900">
                  {(() => {
                    const translated = t(HELP_STEPS[helpStep].key, language);
                    if (translated && translated !== HELP_STEPS[helpStep].key) return translated;
                    return language === 'ko' ? HELP_STEPS[helpStep].title.ko : HELP_STEPS[helpStep].title.en;
                  })()}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {(() => {
                    const translated = t(HELP_STEPS[helpStep].descKey, language);
                    if (translated && translated !== HELP_STEPS[helpStep].descKey) return translated;
                    return language === 'ko' ? HELP_STEPS[helpStep].desc.ko : HELP_STEPS[helpStep].desc.en;
                  })()}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.max(0, s - 1))}
                  disabled={helpStep === 0}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1.5">
                  {HELP_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        i === helpStep ? 'bg-indigo-500' : 'bg-slate-200'
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.min(HELP_STEPS.length - 1, s + 1))}
                  disabled={helpStep === HELP_STEPS.length - 1}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
