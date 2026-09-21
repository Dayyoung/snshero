/**
 * RecipeReverseTrackerSheet.tsx - SCR-08-14
 * 목표 카드 연금 레시피 역추적 북 모달
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface FusionRecipe {
  targetCardId: number;
  targetName: string;
  targetRarity: string;
  materials: {
    cardId: number;
    name: string;
    rarity: string;
    requiredQty: number;
  }[];
  successRate: number;
}

interface RecipeReverseTrackerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: FusionRecipe[];
  userInventory: Record<number, { count: number }>;
  onSelectRecipe: (recipe: FusionRecipe) => void;
  language?: string;
}

export const RecipeReverseTrackerSheet: React.FC<RecipeReverseTrackerSheetProps> = ({
  isOpen,
  onClose,
  recipes,
  userInventory,
  onSelectRecipe,
  language = 'ko',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md max-h-[85vh] bg-slate-950 border border-amber-500/50 rounded-2xl flex flex-col overflow-hidden text-white shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                <BookOpen size={18} />
              </span>
              <div>
                <h2 className="text-sm font-black text-amber-300">
                  {language === 'ko' ? '목표 카드 연금 레시피 역추적 북' : 'Alchemy Recipe Tracker'}
                </h2>
                <p className="text-[10px] text-slate-400">
                  {language === 'ko' ? '보유 재료 기반 즉시 조합 가능한 목표 카드를 탐색합니다' : 'Auto-match target card recipes'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Recipes list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {recipes.map((recipe) => {
              const canCraft = recipe.materials.every(
                m => (userInventory[m.cardId]?.count || 0) >= m.requiredQty
              );

              return (
                <div
                  key={recipe.targetCardId}
                  className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-400">
                        [{recipe.targetRarity}] #{recipe.targetCardId} {recipe.targetName}
                      </span>
                      {canCraft && (
                        <span className="text-[9px] bg-emerald-950 border border-emerald-500 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                          즉시 조합 가능
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">성공률 {recipe.successRate}%</span>
                  </div>

                  {/* Materials list */}
                  <div className="flex flex-wrap gap-1.5 items-center text-[10px] bg-slate-950/80 p-2 rounded-lg border border-slate-850">
                    <span className="text-slate-400 font-bold">필요 재료:</span>
                    {recipe.materials.map((mat, i) => {
                      const owned = userInventory[mat.cardId]?.count || 0;
                      const hasEnough = owned >= mat.requiredQty;
                      return (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded border ${
                            hasEnough
                              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                              : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                          }`}
                        >
                          {mat.name} ({owned}/{mat.requiredQty})
                        </span>
                      );
                    })}
                  </div>

                  {/* Action button */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('heavy');
                      onSelectRecipe(recipe);
                      onClose();
                    }}
                    className={`w-full py-2 rounded-lg font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                      canCraft
                        ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{canCraft ? '1-Tap 슬롯 자동 배치' : '레시피 슬롯 미리보기'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
