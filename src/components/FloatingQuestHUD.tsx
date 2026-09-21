import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronDown, ChevronUp, Sparkles, Target, Zap } from 'lucide-react';

export interface MiniQuestItem {
  id: string;
  title: string;
  current: number;
  max: number;
  rewardSns: number;
  completed: boolean;
}

interface FloatingQuestHUDProps {
  quests: MiniQuestItem[];
  onOpenQuestCenter: () => void;
}

export const FloatingQuestHUD: React.FC<FloatingQuestHUDProps> = ({
  quests,
  onOpenQuestCenter
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const activeQuest = quests.find((q) => !q.completed) || quests[0];

  if (!activeQuest) return null;

  return (
    <div className="fixed bottom-20 right-3 z-40 font-mono select-none">
      <div className="bg-[#fdfcfc] border border-[#201d1d] shadow-lg rounded-sm overflow-hidden w-64">
        {/* Header Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2.5 py-1.5 bg-[#201d1d] text-white flex items-center justify-between cursor-pointer text-xs"
        >
          <div className="flex items-center gap-1.5 font-bold">
            <Target size={13} className="text-amber-400" />
            <span>[QUEST HUD]</span>
          </div>
          <button className="text-white hover:text-amber-300">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Collapsed State: Single active quest */}
        {!isExpanded && (
          <div
            onClick={onOpenQuestCenter}
            className="p-2 text-[11px] cursor-pointer hover:bg-zinc-50 flex items-center justify-between"
          >
            <div className="truncate pr-1">
              <div className="font-bold text-[#201d1d] truncate">
                {activeQuest.title}
              </div>
              <div className="text-[9px] text-[#504a4a]">
                진행도: {activeQuest.current} / {activeQuest.max} (+{activeQuest.rewardSns} SNS)
              </div>
            </div>
            <span className="text-[10px] font-black text-amber-600 shrink-0">
              {Math.floor((activeQuest.current / activeQuest.max) * 100)}%
            </span>
          </div>
        )}

        {/* Expanded State: List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="p-2 space-y-1.5 text-xs max-h-48 overflow-y-auto"
            >
              {quests.slice(0, 4).map((q) => (
                <div
                  key={q.id}
                  className="p-1.5 border border-[rgba(15,0,0,0.12)] rounded-xs bg-white flex items-center justify-between"
                >
                  <div className="truncate pr-1">
                    <div className="font-bold text-[10px] text-[#201d1d] truncate">
                      {q.title}
                    </div>
                    <div className="text-[8px] text-[#504a4a]">
                      {q.current} / {q.max} (+{q.rewardSns} SNS)
                    </div>
                  </div>
                  {q.completed ? (
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  ) : (
                    <span className="text-[9px] font-bold text-amber-600 shrink-0">
                      {Math.floor((q.current / q.max) * 100)}%
                    </span>
                  )}
                </div>
              ))}
              <button
                onClick={onOpenQuestCenter}
                className="w-full py-1 bg-zinc-100 hover:bg-zinc-200 text-[#201d1d] text-[10px] font-bold rounded-xs cursor-pointer text-center"
              >
                [전체 퀘스트 센터 열기]
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
