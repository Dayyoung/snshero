import React, { useState, useEffect } from 'react';
import { Star, Zap, ShieldAlert, Award, Gift, ChevronRight, X, Sparkles, CheckCircle2, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';
import { StoryWorldMapModal } from './StoryWorldMapModal';

interface StoryStageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onStartBattle: (episodeId: number) => void;
  onSweepStage: (episodeId: number) => void;
  currentProgress: number;
}

const STAR_REWARDS_KEY = 'hero_story_star_rewards_claimed';

export const StoryStageSelectModal: React.FC<StoryStageSelectModalProps> = ({
  isOpen,
  onClose,
  language,
  onStartBattle,
  onSweepStage,
  currentProgress,
}) => {
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [sweepResult, setSweepResult] = useState<{ gold: number; exp: number; item: string } | null>(null);
  const [isWorldMapOpen, setIsWorldMapOpen] = useState<boolean>(false);

  useEffect(() => {
    const raw = localStorage.getItem(STAR_REWARDS_KEY);
    if (raw) {
      try {
        setClaimedRewards(JSON.parse(raw));
      } catch (e) {
        setClaimedRewards([]);
      }
    }
  }, []);

  if (!isOpen) return null;

  // Assume total 12 episodes, each has max 3 stars (Total 36 stars possible)
  const totalStars = currentProgress * 3; // Simplified star calculation for progress

  const handleClaimStarReward = (starThreshold: number, rewardSns: number) => {
    if (totalStars < starThreshold) return;
    if (claimedRewards.includes(starThreshold)) return;

    triggerHaptic('victory');
    const updated = [...claimedRewards, starThreshold];
    setClaimedRewards(updated);
    localStorage.setItem(STAR_REWARDS_KEY, JSON.stringify(updated));

    // Update SNS points
    const season = localStorage.getItem('hero_current_season') || 'season1';
    const currentSns = Number(localStorage.getItem(`hero_sns_${season}`) || localStorage.getItem('hero_sns') || 1000);
    const newSns = currentSns + rewardSns;
    localStorage.setItem(`hero_sns_${season}`, String(newSns));
    localStorage.setItem('hero_sns', String(newSns));
    window.dispatchEvent(new Event('snshero_sns_updated'));
  };

  const handleSweep = (epId: number) => {
    triggerHaptic('heavy');
    onSweepStage(epId);

    // Give SNS points for sweep
    const season = localStorage.getItem('hero_current_season') || 'season1';
    const currentSns = Number(localStorage.getItem(`hero_sns_${season}`) || localStorage.getItem('hero_sns') || 1000);
    const newSns = currentSns + 300;
    localStorage.setItem(`hero_sns_${season}`, String(newSns));
    localStorage.setItem('hero_sns', String(newSns));
    window.dispatchEvent(new Event('snshero_sns_updated'));

    setSweepResult({
      gold: 300,
      exp: 150,
      item: language === 'ko' ? '초급 카드 강화석 x2 (+300 SNS)' : 'Basic Upgrade Stone x2 (+300 SNS)',
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl border-2 border-indigo-500/30 bg-slate-900 p-5 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                {language === 'ko' ? '시즌 1 메인 스토리' : 'SEASON 1 MAIN STORY'}
              </span>
              <h3 className="font-mono text-base font-extrabold text-white flex items-center gap-2">
                {language === 'ko' ? '스테이지 선택 및 소탕' : 'Stage Select & Sweep'}
                <button
                  onClick={() => setIsWorldMapOpen(true)}
                  className="px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-400/50 text-indigo-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                >
                  <Map size={12} />
                  {language === 'ko' ? '월드 맵' : 'World Map'}
                </button>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto space-y-4 py-3 pr-1 scrollbar-thin">
            {/* ── Item 56/60: 3-Star Condition Guide ── */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                <Star size={14} className="fill-amber-400" />
                <span>{language === 'ko' ? '3성 클리어 조건 가이드' : '3-Star Clear Conditions'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-amber-400 font-bold block mb-0.5">★ 1성</span>
                  <span className="text-slate-300">{language === 'ko' ? '전투 승리' : 'Victory'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-amber-400 font-bold block mb-0.5">★★ 2성</span>
                  <span className="text-slate-300">{language === 'ko' ? '5장 이상 점령' : 'Capture 5+'}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center">
                  <span className="text-amber-400 font-bold block mb-0.5">★★★ 3성</span>
                  <span className="text-slate-300">{language === 'ko' ? '잔여 HP 80% 이상' : 'HP >= 80%'}</span>
                </div>
              </div>
            </div>

            {/* ── Item 56/60: Accumulated Star Milestone Rewards Bar ── */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-slate-300 flex items-center gap-1">
                  <Award size={14} className="text-indigo-400" />
                  {language === 'ko' ? '누적 별 수집 보상' : 'Star Collection Rewards'}
                </span>
                <span className="text-amber-400">{totalStars} / 36 ★</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { stars: 6, sns: 1000 },
                  { stars: 12, sns: 2500 },
                  { stars: 18, sns: 5000 },
                ].map((item) => {
                  const isClaimed = claimedRewards.includes(item.stars);
                  const canClaim = totalStars >= item.stars && !isClaimed;
                  return (
                    <button
                      key={item.stars}
                      disabled={!canClaim && !isClaimed}
                      onClick={() => handleClaimStarReward(item.stars, item.sns)}
                      className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-between ${
                        isClaimed
                          ? 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60'
                          : canClaim
                          ? 'bg-gradient-to-b from-amber-500/20 to-orange-600/20 border-amber-500 text-amber-300 shadow-md animate-pulse cursor-pointer'
                          : 'bg-slate-900 border-slate-800 text-slate-400 opacity-80'
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold">{item.stars}★ 달성</span>
                      <Gift size={16} className={`my-1 ${canClaim ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span className="text-[9px] font-mono font-bold">
                        {isClaimed ? (language === 'ko' ? '수령완료' : 'Claimed') : `+${item.sns} SNS`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage List & Sweep Action (Item 68) */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 block">
                {language === 'ko' ? '에피소드 스테이지 목록' : 'Episode Stage List'}
              </span>

              {Array.from({ length: 6 }, (_, i) => i + 1).map((ep) => {
                const isCleared = ep <= currentProgress;
                const isThreeStar = ep < currentProgress; // 3-star cleared

                return (
                  <div
                    key={ep}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isCleared
                        ? 'bg-slate-950 border-slate-800 text-white'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-sm text-indigo-400">
                        {ep}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-bold text-slate-200">
                            Stage 1-{ep}
                          </span>
                          {isThreeStar && (
                            <div className="flex text-amber-400">
                              <Star size={10} className="fill-amber-400" />
                              <Star size={10} className="fill-amber-400" />
                              <Star size={10} className="fill-amber-400" />
                            </div>
                          )}
                        </div>

                        {/* Item 72 & ID 97: Grouped Reward Chest Preview Badge */}
                        <div className="flex flex-col gap-0.5 mt-1">
                          <div className="flex items-center gap-1.5">
                            {isCleared ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                                <Gift size={11} className="text-amber-400" />
                                {language === 'ko' ? '📦 클리어 보상 상자' : '📦 Clear Reward Chest'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400 text-amber-300 shadow-sm animate-pulse">
                                <Gift size={11} className="text-amber-400" />
                                {language === 'ko' ? '🎁 최초 보관함: SSR 뽑기권 + 1,000G' : '🎁 First Clear: SSR Ticket + 1,000G'}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">
                            {language === 'ko' ? '🔄 반복 드랍: 300 Gold + 50 EXP' : '🔄 Repeatable: 300 Gold + 50 EXP'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* ID 80: Story mode recommended clear deck load button */}
                      {isCleared && (
                        <button
                          onClick={() => {
                            // Auto load recommended deck for stage
                            const recDeck = [1, 11, 21, 31, 101];
                            localStorage.setItem('hero_playground_deck', JSON.stringify(recDeck));
                            window.dispatchEvent(new Event('snshero_deck_updated'));
                            alert(language === 'ko' ? '⚡ Stage 추천 덱이 자동으로 장착되었습니다!' : '⚡ Recommended Stage Deck loaded!');
                          }}
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                          title={language === 'ko' ? '추천 클리어 덱 즉시 불러오기' : 'Load Recommended Clear Deck'}
                        >
                          <Zap size={11} className="text-amber-400" />
                          <span>{language === 'ko' ? '추천 덱' : 'Rec Deck'}</span>
                        </button>
                      )}

                      {/* ── Item 68: Instant Sweep Button for 3-Star Cleared Stages ── */}
                      {isThreeStar && (
                        <button
                          onClick={() => handleSweep(ep)}
                          className="px-2.5 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold tracking-wider uppercase transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Zap size={12} className="text-cyan-400" />
                          <span>{language === 'ko' ? '소탕 (Sweep)' : 'Sweep'}</span>
                        </button>
                      )}

                      <button
                        disabled={!isCleared}
                        onClick={() => {
                          onStartBattle(ep);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-1 ${
                          isCleared
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <span>{language === 'ko' ? '입장' : 'Enter'}</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sweep Result Popup */}
            {sweepResult && (
              <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono space-y-1 animate-fade-in">
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    {language === 'ko' ? '소탕 보상 수령 완료!' : 'Sweep Reward Collected!'}
                  </span>
                  <button onClick={() => setSweepResult(null)} className="text-cyan-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <div className="text-[11px] space-y-0.5 pt-1 text-slate-300">
                  <p>• {language === 'ko' ? '골드' : 'Gold'}: +{sweepResult.gold}G</p>
                  <p>• {language === 'ko' ? '경험치' : 'EXP'}: +{sweepResult.exp} XP</p>
                  <p>• {language === 'ko' ? '획득 아이템' : 'Item'}: {sweepResult.item}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* World Map Modal (Item 76) */}
      <StoryWorldMapModal
        isOpen={isWorldMapOpen}
        onClose={() => setIsWorldMapOpen(false)}
        language={language}
        onSelectStage={(act, step) => {
          setSelectedEpisode((act - 1) * 5 + step);
        }}
      />
    </AnimatePresence>
  );
};
