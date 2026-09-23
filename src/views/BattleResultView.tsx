/**
 * BattleResultView.tsx - SCR-08-28, SCR-08-29, SCR-08-30
 * High-performance, 60fps Battle Result & Settlement Screen.
 * Integrates WebGL Victory Fanfare, 3-Star Stamp Physics, Super Fast Skip,
 * Thumb-Zone Auto-Repeat, and Historical First Clear Hall of Fame.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, RotateCcw, ArrowRight, Star, Coins, Zap, Shield, Sparkles, Award
} from 'lucide-react';
import { VictoryFanfareRenderer } from '../engine/VictoryFanfareRenderer';
import { StarStampEffect } from '../components/StarStampEffect';
import { SuperFastSkipHandler } from '../components/SuperFastSkipHandler';
import { AutoRepeatToggleSwitch } from '../components/AutoRepeatToggleSwitch';
import { FirstClearHallOfFameModal } from '../components/FirstClearHallOfFameModal';
import { firstClearSpecialOfferService, FirstClearOffer } from '../services/FirstClearSpecialOfferService';
import { triggerHaptic } from '../lib/haptic';
import { cn } from '../lib/utils';

export interface BattleRewardItem {
  id: string;
  name: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'diamond';
  amount: number;
}

export interface BattleResultViewProps {
  isVictory: boolean;
  stageId: string;
  stageName: string;
  starsEarned?: number;
  expEarned?: number;
  snsEarned?: number;
  lootItems?: BattleRewardItem[];
  onRematch: () => void;
  onContinue: () => void;
  playSfx?: (name: string) => void;
  language?: string;
  isBossStage?: boolean;
}

export const BattleResultView: React.FC<BattleResultViewProps> = ({
  isVictory,
  stageId,
  stageName,
  starsEarned = 3,
  expEarned = 120,
  snsEarned = 45,
  lootItems = [],
  onRematch,
  onContinue,
  playSfx,
  language = 'ko',
  isBossStage = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fanfareRef = useRef<VictoryFanfareRenderer>(new VictoryFanfareRenderer());

  const [isSkipped, setIsSkipped] = useState(false);
  const [displayedExp, setDisplayedExp] = useState(0);
  const [displayedSns, setDisplayedSns] = useState(0);

  // Auto repeat state
  const [autoRepeatEnabled, setAutoRepeatEnabled] = useState<boolean>(() => {
    return localStorage.getItem('hero_auto_repeat_battle') === 'true';
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [repeatCount, setRepeatCount] = useState<number>(0);

  // First Clear State
  const [firstClearOffer, setFirstClearOffer] = useState<FirstClearOffer | null>(null);
  const [showHallOfFame, setShowHallOfFame] = useState(false);

  // 1. Initialize WebGL Fanfare Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fanfareRef.current.init(canvas);

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      fanfareRef.current.update(dt);
      fanfareRef.current.render();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    if (isVictory) {
      // Trigger initial victory fanfare
      setTimeout(() => {
        fanfareRef.current.triggerFanfare(window.innerWidth / 2, window.innerHeight * 0.35, 140);
        playSfx?.('fanfare');
        triggerHaptic('heavy');
      }, 200);
    }

    return () => {
      cancelAnimationFrame(animId);
      fanfareRef.current.dispose();
    };
  }, [isVictory, playSfx]);

  // 2. Check First Clear
  useEffect(() => {
    if (isVictory && isBossStage) {
      const { isFirst, offer } = firstClearSpecialOfferService.recordStageClear(stageId, stageName);
      if (isFirst && offer) {
        setFirstClearOffer(offer);
        setShowHallOfFame(true);
      }
    }
  }, [isVictory, isBossStage, stageId, stageName]);

  // 3. Counter Rolling Animation
  useEffect(() => {
    if (isSkipped) {
      setDisplayedExp(expEarned);
      setDisplayedSns(snsEarned);
      return;
    }

    const duration = 800;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayedExp(Math.floor(progress * expEarned));
      setDisplayedSns(Math.floor(progress * snsEarned));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, [isSkipped, expEarned, snsEarned]);

  // 4. Auto-repeat Countdown
  useEffect(() => {
    if (!autoRepeatEnabled || !isVictory) {
      setCountdown(null);
      return;
    }

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          setRepeatCount(c => c + 1);
          onRematch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRepeatEnabled, isVictory, onRematch]);

  // 5. Fast Skip Trigger
  const handleFastSkip = useCallback(() => {
    setIsSkipped(true);
    setDisplayedExp(expEarned);
    setDisplayedSns(snsEarned);
    playSfx?.('tap');
    triggerHaptic('light');
  }, [expEarned, snsEarned, playSfx]);

  const handleToggleAutoRepeat = (enabled: boolean) => {
    setAutoRepeatEnabled(enabled);
    localStorage.setItem('hero_auto_repeat_battle', enabled ? 'true' : 'false');
  };

  return (
    <SuperFastSkipHandler onFastSkip={handleFastSkip} disabled={isSkipped}>
      <div 
        id="battle-result-viewport"
        className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-[#090d16] text-slate-100 flex flex-col justify-between font-mono z-[110]"
      >
        {/* WebGL Particle Fanfare Canvas (Zero DOM Reflow) */}
        <canvas
          ref={canvasRef}
          id="battle-victory-fanfare-canvas"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Header Ribbon */}
        <header className="w-full pt-8 pb-3 px-4 flex flex-col items-center shrink-0 z-20">
          <motion.div
            initial={isSkipped ? false : { y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-700 text-[10px] text-stone-400 font-bold uppercase tracking-wider"
          >
            <span>STAGE SETTLEMENT</span>
            <span>•</span>
            <span className="text-cyan-300">{stageName}</span>
          </motion.div>

          <motion.h1
            initial={isSkipped ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={cn(
              "text-3xl sm:text-4xl font-black tracking-tighter mt-1 drop-shadow-md",
              isVictory ? "text-amber-400" : "text-rose-500"
            )}
          >
            {isVictory ? 'VICTORY!' : 'DEFEAT'}
          </motion.h1>
        </header>

        {/* Center Content: Star Stamp & Loot Box */}
        <main className="flex-1 w-full max-w-sm mx-auto px-4 flex flex-col justify-center items-center gap-4 z-20">
          {/* 3-Star Stamp Physics Effect */}
          {isVictory && (
            <StarStampEffect
              starsEarned={starsEarned}
              isFastSkipped={isSkipped}
              playSfx={playSfx}
              onStarLand={(_, x, y) => {
                fanfareRef.current.triggerStarBurst(starsEarned, x, y);
              }}
            />
          )}

          {/* Reward Settlement Box */}
          <motion.div
            initial={isSkipped ? false : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="w-full bg-stone-950/80 border border-stone-800 rounded-sm p-3.5 space-y-3 shadow-xl backdrop-blur-xs"
          >
            {/* EXP & SNS Points */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xs bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xs bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="text-[9px] text-stone-400 uppercase font-bold">EXP GAIN</div>
                  <div className="text-sm font-black text-cyan-300">+{displayedExp}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xs bg-stone-900/80 border border-stone-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xs bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                  <Coins size={18} />
                </div>
                <div>
                  <div className="text-[9px] text-stone-400 uppercase font-bold">SNS REWARD</div>
                  <div className="text-sm font-black text-amber-300">+{displayedSns} SNS</div>
                </div>
              </div>
            </div>

            {/* Loot Drops */}
            {lootItems.length > 0 && (
              <div>
                <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" />
                  <span>CLEAR LOOT DROPS</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {lootItems.map(item => (
                    <div
                      key={item.id}
                      className="px-2 py-1 rounded-xs bg-stone-900 border border-stone-700 flex items-center gap-1.5 text-[10px] whitespace-nowrap"
                    >
                      <span className="font-bold text-amber-300">{item.name}</span>
                      <span className="text-stone-400">x{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </main>

        {/* Footer Thumb Zone: Auto Repeat & Action Buttons */}
        <footer className="w-full max-w-sm mx-auto px-4 pb-6 flex flex-col gap-2.5 shrink-0 z-20">
          {/* 48px Thumb Zone Auto Repeat Switch */}
          {isVictory && (
            <AutoRepeatToggleSwitch
              enabled={autoRepeatEnabled}
              onToggle={handleToggleAutoRepeat}
              countdown={countdown}
              repeatCount={repeatCount}
            />
          )}

          {/* Action Button Row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="battle-result-rematch-btn"
              onClick={() => {
                triggerHaptic('medium');
                playSfx?.('tap');
                onRematch();
              }}
              className="h-12 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
            >
              <RotateCcw size={15} />
              <span>{language === 'ko' ? '다시 도전' : 'REMATCH'}</span>
            </button>

            <button
              type="button"
              id="battle-result-continue-btn"
              onClick={() => {
                triggerHaptic('medium');
                playSfx?.('tap');
                onContinue();
              }}
              className="h-12 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <span>{language === 'ko' ? '확인 및 계속' : 'CONTINUE'}</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="text-center text-[9px] text-stone-500">
            화면을 더블 탭하면 0.2초 만에 스킵됩니다
          </div>
        </footer>

        {/* First Clear Hall of Fame Modal (SCR-08-30) */}
        <AnimatePresence>
          {showHallOfFame && firstClearOffer && (
            <FirstClearHallOfFameModal
              offer={firstClearOffer}
              onClose={() => setShowHallOfFame(false)}
              playSfx={playSfx}
            />
          )}
        </AnimatePresence>
      </div>
    </SuperFastSkipHandler>
  );
};

export default BattleResultView;
