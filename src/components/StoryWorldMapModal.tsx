import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Map, Star, Lock, CheckCircle2, Trophy, ArrowRight, Sparkles, Shield, Compass } from 'lucide-react';
import { Language } from '../types';
import { useStoryProgress } from '../hooks/useStoryProgress';

interface StoryWorldMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectStage?: (act: number, step: number) => void;
}

export const StoryWorldMapModal: React.FC<StoryWorldMapModalProps> = ({
  isOpen,
  onClose,
  language,
  onSelectStage,
}) => {
  const currentSeason = typeof window !== 'undefined'
    ? (localStorage.getItem('hero_current_season') || 'season1')
    : 'season1';

  const { storyProgressCount, totalStoryEpisodes, storyProgressPercent } = useStoryProgress({ season: currentSeason });

  if (!isOpen) return null;

  const ACTS = [
    {
      act: 1,
      title_ko: 'Act 1: 서막 - 시작되는 위기',
      title_en: 'Act 1: Prelude of Crisis',
      desc_ko: '아케인 대륙 외곽의 이상 징후를 조사하고 첫 시련을 극복하세요.',
      desc_en: 'Investigate strange anomalies on the outskirts of Arcane continent.',
      totalSteps: 5,
      requiredStars: 0,
      bgGradient: 'from-blue-900/40 via-indigo-950/60 to-slate-900',
      borderColor: 'border-blue-500/50',
      nodeColor: 'bg-blue-600',
    },
    {
      act: 2,
      title_ko: 'Act 2: 전란의 파도 - 격돌하는 성역',
      title_en: 'Act 2: Tides of War',
      desc_ko: '격렬해지는 마수의 침공 속에서 숨겨진 고대 마법을 각성합니다.',
      desc_en: 'Awaken ancient magic amidst intensifying beast invasions.',
      totalSteps: 5,
      requiredStars: 10,
      bgGradient: 'from-amber-900/40 via-red-950/60 to-slate-900',
      borderColor: 'border-amber-500/50',
      nodeColor: 'bg-amber-600',
    },
    {
      act: 3,
      title_ko: 'Act 3: 아케인의 번영 - 운명의 결전',
      title_en: 'Act 3: Arcane Pinnacle',
      desc_ko: '대륙 최정상의 위협에 맞서 세계의 평화를 되찾는 최종 결전입니다.',
      desc_en: 'The ultimate battle to restore peace to the world.',
      totalSteps: 5,
      requiredStars: 25,
      bgGradient: 'from-purple-900/40 via-fuchsia-950/60 to-slate-900',
      borderColor: 'border-purple-500/50',
      nodeColor: 'bg-purple-600',
    },
  ];

  const totalPossibleStars = 45; // 3 Acts * 5 Steps * 3 Stars
  const currentStars = Math.min(totalPossibleStars, Math.floor(storyProgressCount * 3));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl">
                <Map size={22} />
              </div>
              <div>
                <h3 className="font-black text-lg text-amber-300 flex items-center gap-2">
                  {language === 'ko' ? '스토리 챕터 월드 맵 요약' : 'Story Chapter World Map'}
                </h3>
                <p className="text-xs text-slate-400">
                  {language === 'ko' ? '전체 세계관 스토리 진행 상황 및 챕터 현황' : 'Overall story progress and chapter map'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                {language === 'ko' ? '전체 스토리 진행률' : 'Completion Rate'}
              </span>
              <div className="flex items-center justify-center gap-1">
                <Compass size={14} className="text-indigo-400" />
                <span className="font-mono font-black text-amber-300 text-base">{storyProgressPercent}%</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                {language === 'ko' ? '수집한 총 별' : 'Total Stars'}
              </span>
              <div className="flex items-center justify-center gap-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="font-mono font-black text-amber-300 text-base">{currentStars} / {totalPossibleStars}</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
              <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                {language === 'ko' ? '클리어 에피소드' : 'Cleared Episodes'}
              </span>
              <div className="flex items-center justify-center gap-1">
                <Trophy size={14} className="text-emerald-400" />
                <span className="font-mono font-black text-amber-300 text-base">{storyProgressCount} / {totalStoryEpisodes}</span>
              </div>
            </div>
          </div>

          {/* World Map Progression Canvas */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {ACTS.map((actInfo) => {
              const actProgress = Math.max(0, Math.min(5, storyProgressCount - (actInfo.act - 1) * 5));
              const isActUnlocked = currentStars >= actInfo.requiredStars;

              return (
                <div
                  key={actInfo.act}
                  className={`relative p-5 rounded-2xl border bg-gradient-to-r ${actInfo.bgGradient} ${actInfo.borderColor} overflow-hidden shadow-lg`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${actInfo.nodeColor}`}>
                          ACT 0{actInfo.act}
                        </span>
                        <h4 className="font-extrabold text-base text-white">
                          {language === 'ko' ? actInfo.title_ko : actInfo.title_en}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-300">
                        {language === 'ko' ? actInfo.desc_ko : actInfo.desc_en}
                      </p>
                    </div>

                    <div className="shrink-0 text-right font-mono text-xs">
                      <span className="text-amber-300 font-black">{actProgress} / {actInfo.totalSteps}</span>
                      <span className="text-slate-400 block text-[10px]">
                        {language === 'ko' ? '스테이지 완료' : 'Stages Cleared'}
                      </span>
                    </div>
                  </div>

                  {/* Stage Node Path */}
                  <div className="relative my-4 py-2">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-700/80 -translate-y-1/2 rounded-full" />
                    <div
                      className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-amber-400 to-indigo-500 -translate-y-1/2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (actProgress / actInfo.totalSteps) * 92)}%` }}
                    />

                    {/* Nodes */}
                    <div className="relative z-10 flex justify-between items-center px-2">
                      {[1, 2, 3, 4, 5].map((step) => {
                        const globalStageIdx = (actInfo.act - 1) * 5 + step;
                        const isCleared = globalStageIdx <= storyProgressCount;
                        const isCurrent = globalStageIdx === storyProgressCount + 1;

                        return (
                          <button
                            key={step}
                            onClick={() => {
                              if (onSelectStage) {
                                onSelectStage(actInfo.act, step);
                                onClose();
                              }
                            }}
                            className={`flex flex-col items-center gap-1 group cursor-pointer transition-transform hover:scale-110`}
                          >
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-black text-xs border-2 shadow-md transition-all ${
                                isCleared
                                  ? 'bg-emerald-500 border-emerald-300 text-white shadow-emerald-500/50'
                                  : isCurrent
                                  ? 'bg-amber-500 border-amber-300 text-slate-900 animate-bounce shadow-amber-500/50'
                                  : 'bg-slate-800 border-slate-600 text-slate-500'
                              }`}
                            >
                              {isCleared ? <CheckCircle2 size={16} /> : `${actInfo.act}-${step}`}
                            </div>
                            <div className="flex gap-0.5 text-[8px] text-amber-400">
                              <Star size={8} className={isCleared ? 'fill-amber-400' : 'opacity-30'} />
                              <Star size={8} className={isCleared ? 'fill-amber-400' : 'opacity-30'} />
                              <Star size={8} className={isCleared ? 'fill-amber-400' : 'opacity-30'} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
