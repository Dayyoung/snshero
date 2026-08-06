import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Lock, HelpCircle, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Skill, Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { INITIAL_SKILLS, getSkillTier, getRequiredLevelForSkill } from '../constants';
import { PageHeader } from '../components/PageHeader';
import { getSkillResetCost, getSkillUpgradeCost, getSpendShortfall } from '../content/snsEconomy';

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
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Zap: Zap,
  Lock: Lock,
};

const HELP_STEPS = [
  { titleKey: 'skill_help_upgrade', descKey: 'skill_help_upgrade_desc' },
  { titleKey: 'skill_help_reset', descKey: 'skill_help_reset_desc' },
  { titleKey: 'skill_help_points', descKey: 'skill_help_points_desc' },
];

const cleanSkillName = (name: string) => name.replace(/\s+[IVX]+$/, '');

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
  isImpersonating = false
}) => {

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

  const handleResetConfirm = () => {
    onResetSkills();
    setShowResetConfirm(false);
  };

  return (
    <div id="skill-tree" className="p-4 md:p-8 pb-32 max-w-4xl mx-auto min-h-screen text-slate-800 font-sans">
      <PageHeader
        title={t('skills', language)}
        onBack={onBack}
        rightAction={
          <button
            type="button"
            onClick={() => { setHelpOpen(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <HelpCircle size={16} />
          </button>
        }
      />

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
              <div className="flex items-center gap-4 text-red-650">
                <AlertTriangle size={28} />
                <h3 className="text-xl font-bold uppercase tracking-tight">
                  {language === 'ko' ? '초기화 프로토콜' : 'RESET PROTOCOL'}
                </h3>
              </div>

              <p className="text-sm font-medium leading-relaxed text-slate-600">
                {language === 'ko'
                  ? `정말로 모든 스킬을 초기화하시겠습니까?\n비용: ${cost} SNS\n(투자된 모든 스킬 포인트가 반환됩니다)`
                  : `Are you sure you want to reset ALL skills?\nCost: ${cost} SNS\n(All invested points will be returned)`}
              </p>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 border border-slate-200 bg-white text-slate-700 font-semibold uppercase rounded-xl hover:bg-slate-50 transition-all text-sm"
                >
                  {language === 'ko' ? '취소' : 'CANCEL'}
                </button>
                <button
                  onClick={handleResetConfirm}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold uppercase rounded-xl shadow-md shadow-red-500/10 transition-all text-sm"
                >
                  {language === 'ko' ? '확인' : 'CONFIRM'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => {
          const baseSkill = INITIAL_SKILLS.find(s => s.id === skill.id) || skill;
          const isMaxLevel = skill.level >= 100;
          const upgradeCost = getSkillUpgradeCost(skill.level);
          const canAfford = sns >= upgradeCost || isImpersonating;
          const displayName = cleanSkillName(language === 'ko' ? (baseSkill.name || skill.name) : (baseSkill.name_en || skill.name_en));

          return (
            <div
              key={skill.id}
              className="relative flex flex-col p-4 rounded-lg border border-slate-100 bg-white shadow-sm"
            >
              <h3 className="text-sm font-bold uppercase text-slate-900 mb-3">{displayName}</h3>

              <button
                disabled={isMaxLevel || !canAfford}
                onClick={() => onUpgradeSkill(skill.id)}
                id={`skill-upgrade-${skill.id}`}
                className={cn(
                  "w-full py-2.5 rounded-lg font-bold uppercase text-xs transition-all active:scale-95 border",
                  (isMaxLevel || !canAfford)
                    ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-rose-600 border-red-500/20 text-white hover:from-red-650 hover:to-rose-700 shadow-md shadow-red-500/10"
                )}
              >
                {isMaxLevel
                  ? 'MAX LEVEL'
                  : (isImpersonating
                    ? 'ADMIN FORCED UPGRADE'
                    : `${language === 'ko' ? '스킬 강화' : 'UPGRADE'} (${upgradeCost} SNS)`)}
              </button>
            </div>
          );
        })}
      </div>

      {/* Reset Button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="group flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-650 active:scale-95 shadow-sm transition-all"
        >
          <span className="text-sm font-bold uppercase">{language === 'ko' ? '스킬 초기화' : 'RESET SKILLS'}</span>
        </button>
      </div>

      {/* Help Popup */}
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
                className="absolute top-3 right-3 w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X size={14} />
              </button>

              <div className="text-center mb-5">
                <HelpCircle size={24} className="mx-auto text-indigo-500 mb-2" />
                <h3 className="text-sm font-black text-slate-900">
                  {t(HELP_STEPS[helpStep].titleKey, language)}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {t(HELP_STEPS[helpStep].descKey, language)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.max(0, s - 1))}
                  disabled={helpStep === 0}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1.5">
                  {HELP_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        i === helpStep ? 'bg-indigo-500' : 'bg-slate-200',
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.min(HELP_STEPS.length - 1, s + 1))}
                  disabled={helpStep === HELP_STEPS.length - 1}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
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
