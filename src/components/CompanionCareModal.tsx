import React, { useState, useEffect } from 'react';
import { Heart, Cookie, Sparkles, X, Shield, Award, Zap } from 'lucide-react';
import { CardData } from '../types';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { playAffectionHeartChime, playAffectionMaxSfx } from '../lib/sound';

export interface CardAffectionState {
  affection: number; // 0 to 100
  maxUnlocked: boolean;
  lastFreeSnackDate?: string;
  dailyPatCount?: number;
  lastPatDate?: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  y: number;
}

interface CompanionCareModalProps {
  card: CardData;
  season: string;
  language: string;
  snsBalance: number;
  onConsumeSns: (amount: number, reason: string) => boolean;
  onClose: () => void;
  onAffectionUpdate?: (cardId: number, state: CardAffectionState) => void;
}

export const getCardAffectionKey = (season: string) => `hero_card_affection_${season}`;

export const loadCardAffectionState = (cardId: number, season: string): CardAffectionState => {
  try {
    const raw = localStorage.getItem(getCardAffectionKey(season));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[cardId]) {
        return parsed[cardId];
      }
    }
  } catch {}
  return { affection: 0, maxUnlocked: false, dailyPatCount: 0 };
};

export const saveCardAffectionState = (cardId: number, season: string, state: CardAffectionState) => {
  try {
    const key = getCardAffectionKey(season);
    const raw = localStorage.getItem(key);
    const all = raw ? JSON.parse(raw) : {};
    all[cardId] = state;
    localStorage.setItem(key, JSON.stringify(all));
  } catch {}
};

export const CompanionCareModal: React.FC<CompanionCareModalProps> = ({
  card,
  season,
  language,
  snsBalance,
  onConsumeSns,
  onClose,
  onAffectionUpdate,
}) => {
  const isKo = language === 'ko';
  const todayStr = new Date().toISOString().split('T')[0];

  const [state, setState] = useState<CardAffectionState>(() =>
    loadCardAffectionState(card.id, season)
  );

  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync state changes to storage
  const updateAndSaveState = (updater: (prev: CardAffectionState) => CardAffectionState) => {
    setState(prev => {
      const next = updater(prev);
      const isNewlyMax = next.affection >= 100 && !prev.maxUnlocked;
      if (next.affection >= 100) {
        next.affection = 100;
        next.maxUnlocked = true;
      }
      saveCardAffectionState(card.id, season, next);
      if (onAffectionUpdate) onAffectionUpdate(card.id, next);

      if (isNewlyMax) {
        playAffectionMaxSfx();
        triggerHaptic('heavy');
        setFeedbackMsg(
          isKo
            ? '🎉 친밀도 MAX 달성! [히든 패시브: 플립 방어 +5%] 해금!'
            : '🎉 Affection MAX! [Hidden Passive: Flip Defense +5%] Unlocked!'
        );
      }
      return next;
    });
  };

  const spawnFloatingHeart = (e?: React.MouseEvent) => {
    const id = Date.now() + Math.random();
    let x = 50;
    let y = 40;
    if (e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = ((e.clientX - rect.left) / rect.width) * 100;
      y = ((e.clientY - rect.top) / rect.height) * 100;
    }
    setFloatingHearts(prev => [...prev.slice(-6), { id, x, y }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1200);
  };

  // Patting / Petting Interaction (Up to 5 times daily)
  const handlePat = (e: React.MouseEvent) => {
    const isToday = state.lastPatDate === todayStr;
    const currentCount = isToday ? (state.dailyPatCount || 0) : 0;

    if (currentCount >= 5) {
      setFeedbackMsg(isKo ? '오늘의 쓰다듬기 한도(5회)를 모두 채웠습니다.' : 'Daily patting limit (5 times) reached.');
      triggerHaptic('light');
      setTimeout(() => setFeedbackMsg(null), 2000);
      return;
    }

    spawnFloatingHeart(e);
    playAffectionHeartChime();
    triggerHaptic('medium');

    updateAndSaveState(prev => {
      const count = isToday ? (prev.dailyPatCount || 0) + 1 : 1;
      return {
        ...prev,
        affection: Math.min(100, prev.affection + 3),
        dailyPatCount: count,
        lastPatDate: todayStr,
      };
    });

    setFeedbackMsg(isKo ? `쓰다듬기 성공! 애정도 +3 (남은 횟수: ${4 - currentCount})` : `Petted! Affection +3 (${4 - currentCount} left)`);
    setTimeout(() => setFeedbackMsg(null), 1800);
  };

  // Free Daily Snack
  const canFreeSnack = state.lastFreeSnackDate !== todayStr;
  const handleFreeSnack = () => {
    if (!canFreeSnack) {
      setFeedbackMsg(isKo ? '오늘의 무료 간식을 이미 수령했습니다.' : 'Already claimed daily free snack.');
      triggerHaptic('light');
      setTimeout(() => setFeedbackMsg(null), 2000);
      return;
    }

    spawnFloatingHeart();
    playAffectionHeartChime();
    triggerHaptic('success');

    updateAndSaveState(prev => ({
      ...prev,
      affection: Math.min(100, prev.affection + 15),
      lastFreeSnackDate: todayStr,
    }));

    setFeedbackMsg(isKo ? '맛있는 별사탕 간식을 먹었습니다! 애정도 +15' : 'Fed delicious candy! Affection +15');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Premium Energy Jelly (10 SNS)
  const handlePremiumSnack = () => {
    if (snsBalance < 10) {
      setFeedbackMsg(isKo ? 'SNS 포인트가 부족합니다. (10 SNS 필요)' : 'Not enough SNS points. (10 SNS needed)');
      triggerHaptic('warning');
      setTimeout(() => setFeedbackMsg(null), 2000);
      return;
    }

    const success = onConsumeSns(10, `카드 #${card.id} 영양 젤리 간식 급여`);
    if (!success) {
      setFeedbackMsg(isKo ? 'SNS 차감에 실패했습니다.' : 'Failed to deduct SNS.');
      return;
    }

    spawnFloatingHeart();
    playAffectionHeartChime();
    triggerHaptic('heavy');

    updateAndSaveState(prev => ({
      ...prev,
      affection: Math.min(100, prev.affection + 20),
    }));

    setFeedbackMsg(isKo ? '최고급 에너지 젤리를 먹였습니다! 애정도 +20' : 'Fed Premium Energy Jelly! Affection +20');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const getAffectionLevel = (val: number) => {
    if (val >= 100) return { lv: 'MAX', label: isKo ? '영혼의 동반자' : 'Soul Bound', color: 'text-amber-400' };
    if (val >= 75) return { lv: 'Lv.4', label: isKo ? '절친한 동료' : 'Trusted Ally', color: 'text-purple-400' };
    if (val >= 50) return { lv: 'Lv.3', label: isKo ? '믿음직한 파트너' : 'Reliable Partner', color: 'text-blue-400' };
    if (val >= 25) return { lv: 'Lv.2', label: isKo ? '친숙한 사이' : 'Familiar Friend', color: 'text-emerald-400' };
    return { lv: 'Lv.1', label: isKo ? '서먹한 만남' : 'New Acquaintance', color: 'text-slate-400' };
  };

  const currentLv = getAffectionLevel(state.affection);
  const patsRemaining = state.lastPatDate === todayStr ? Math.max(0, 5 - (state.dailyPatCount || 0)) : 5;

  return (
    <div className="fixed inset-0 z-[10050] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-md bg-[#161414] border-2 border-pink-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl text-white font-mono flex flex-col relative max-h-[92dvh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/50 flex items-center justify-center">
            <Heart size={18} className="text-pink-400 fill-pink-400 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black uppercase text-pink-400 tracking-wider">
              {isKo ? '영웅 다마고치 애정도 & 돌봄' : 'COMPANION CARE & AFFECTION'}
            </div>
            <div className="text-[11px] text-slate-400">
              {card.name} ({card.element.toUpperCase()})
            </div>
          </div>
        </div>

        {/* Interactive Card Canvas Area */}
        <div
          onClick={handlePat}
          className="relative w-full h-52 sm:h-56 bg-gradient-to-b from-slate-900 to-[#1c161a] border-2 border-pink-500/30 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer active:scale-98 transition-transform group shadow-inner"
          title={isKo ? '카드를 탭하여 쓰다듬어주세요 (+3 하트)' : 'Tap to pet (+3 Heart)'}
        >
          {/* Card Portrait */}
          <div className="relative w-28 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg group-hover:border-pink-400 transition-colors">
            <img
              src={`/assets/cards/${card.imageIndex}.png`}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/cards/0.png';
              }}
            />
            {state.maxUnlocked && (
              <div className="absolute top-1 right-1 bg-amber-400 text-black text-[8px] font-black px-1 rounded-xs flex items-center gap-0.5">
                <Sparkles size={9} />
                <span>MAX</span>
              </div>
            )}
          </div>

          {/* Floating Hearts Animation */}
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute pointer-events-none text-pink-400 animate-out fade-out slide-out-to-top-12 duration-1000"
              style={{ left: `${heart.x}%`, top: `${heart.y}%` }}
            >
              <Heart size={24} className="fill-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
            </div>
          ))}

          {/* Tap Prompt Overlay */}
          <div className="absolute bottom-2 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-full border border-pink-500/40 text-[10px] text-pink-300 font-bold flex items-center gap-1.5 shadow-sm">
            <Sparkles size={11} className="text-pink-400" />
            <span>
              {isKo
                ? `탭하여 쓰다듬기 (오늘 잔여: ${patsRemaining}/5)`
                : `Tap to pet (Daily: ${patsRemaining}/5)`}
            </span>
          </div>
        </div>

        {/* Feedback / Toast Message */}
        {feedbackMsg && (
          <div className="mt-2 py-1.5 px-3 bg-pink-500/20 border border-pink-500/50 text-pink-300 text-xs font-bold rounded-lg flex items-center gap-1.5 animate-in fade-in duration-200">
            <Sparkles size={13} className="text-pink-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Affection Progress Bar */}
        <div className="mt-3 p-3 bg-slate-900/90 border border-white/10 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className={cn("font-black", currentLv.color)}>{currentLv.lv}</span>
              <span className="text-slate-300 font-bold">{currentLv.label}</span>
            </div>
            <div className="text-pink-400 font-black">
              {state.affection} / 100 pt
            </div>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5 relative">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${state.affection}%` }}
            />
          </div>

          {/* Hidden Passive Perk Banner */}
          <div className={cn(
            "p-2 rounded-lg border flex items-center justify-between text-[11px]",
            state.maxUnlocked
              ? "bg-amber-400/15 border-amber-400/40 text-amber-300"
              : "bg-slate-800/60 border-slate-700 text-slate-400"
          )}>
            <div className="flex items-center gap-2">
              <Shield size={14} className={state.maxUnlocked ? "text-amber-400" : "text-slate-500"} />
              <div>
                <span className="font-black">
                  {isKo ? '히든 패시브: [플립 방어 +5%]' : 'Hidden Passive: [Flip Defense +5%]'}
                </span>
                <span className="block text-[9px] text-slate-400">
                  {isKo ? '배틀 아레나에서 상대 뒤집기 공격 5% 확률 방어' : '5% chance to deflect opponent flips in Battle'}
                </span>
              </div>
            </div>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-black uppercase",
              state.maxUnlocked ? "bg-amber-400 text-black" : "bg-slate-700 text-slate-400"
            )}>
              {state.maxUnlocked ? (isKo ? '적용중' : 'ACTIVE') : (isKo ? '미해금' : 'LOCKED')}
            </span>
          </div>
        </div>

        {/* Snack Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {/* Free Daily Candy */}
          <button
            type="button"
            onClick={handleFreeSnack}
            disabled={!canFreeSnack}
            className={cn(
              "p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95",
              canFreeSnack
                ? "bg-gradient-to-b from-pink-900/40 to-slate-900 border-pink-500/50 hover:border-pink-400 text-white"
                : "bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-1 text-xs font-black">
              <Cookie size={14} className={canFreeSnack ? "text-pink-400" : "text-slate-600"} />
              <span>{isKo ? '매일 무료 간식' : 'Daily Free Candy'}</span>
            </div>
            <span className="text-[10px] text-pink-300 font-bold">
              {canFreeSnack ? (isKo ? '애정도 +15 (무료)' : '+15 Hearts (Free)') : (isKo ? '수령 완료' : 'Claimed')}
            </span>
          </button>

          {/* Premium Energy Jelly (10 SNS) */}
          <button
            type="button"
            onClick={handlePremiumSnack}
            className="p-2.5 rounded-xl border bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/50 hover:border-amber-400 text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-1 text-xs font-black text-amber-300">
              <Zap size={14} className="text-amber-400" />
              <span>{isKo ? '에너지 젤리 급여' : 'Energy Jelly'}</span>
            </div>
            <span className="text-[10px] text-amber-200 font-bold flex items-center gap-1">
              <span>{isKo ? '애정도 +20' : '+20 Hearts'}</span>
              <span className="px-1 bg-amber-400 text-black rounded text-[9px] font-black">10 SNS</span>
            </span>
          </button>
        </div>

        {/* Footnote */}
        <div className="mt-3 text-center text-[10px] text-slate-500">
          {isKo
            ? '💡 친밀도 100 달성 시 덱에 편성된 동안 영구 방어 패시브가 자동 적용됩니다.'
            : '💡 Reaching 100 grants permanent Flip Defense +5% while equipped in your deck.'}
        </div>
      </div>
    </div>
  );
};
