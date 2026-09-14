import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Swords, Shield, Coins } from 'lucide-react';
import { Language } from '../types';
import { AudioSpriteService } from '../lib/AudioSpriteService';

interface TurnOrderDeciderModalProps {
  isOpen: boolean;
  isPlayerFirst: boolean;
  onComplete: () => void;
  language: Language;
}

export const TurnOrderDeciderModal: React.FC<TurnOrderDeciderModalProps> = ({
  isOpen,
  isPlayerFirst,
  onComplete,
  language,
}) => {
  const [stage, setStage] = useState<'flipping' | 'resolved'>('flipping');

  useEffect(() => {
    if (!isOpen) {
      setStage('flipping');
      return;
    }

    // 재생 효과음
    AudioSpriteService.play('coin_toss');

    // 1.2초 동안 코인 회전 후 결과 표시
    const flipTimer = setTimeout(() => {
      setStage('resolved');
      AudioSpriteService.play('button_click');
    }, 1200);

    // 2.2초 후 자동 완료 콜백
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(completeTimer);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 text-zinc-100 p-6 shadow-2xl text-center space-y-5"
        >
          {/* Header */}
          <div className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center justify-center gap-1.5">
            <Coins size={14} className="text-amber-400" />
            <span>{language === 'ko' ? '턴 순서 결정 (Coin Toss)' : 'Turn Order Decider'}</span>
          </div>

          {/* 3D Spinning Coin Container */}
          <div className="flex justify-center py-3">
            <motion.div
              animate={stage === 'flipping' ? { rotateY: 1800, scale: [1, 1.25, 1] } : { rotateY: 0, scale: 1.1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-xl ${
                stage === 'flipping'
                  ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border-yellow-300 text-zinc-950'
                  : isPlayerFirst
                  ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-500 border-cyan-300 text-white shadow-blue-500/50'
                  : 'bg-gradient-to-tr from-rose-600 via-red-500 to-orange-500 border-rose-300 text-white shadow-rose-500/50'
              }`}
            >
              {stage === 'flipping' ? (
                <Coins size={40} className="animate-spin-slow" />
              ) : isPlayerFirst ? (
                <Swords size={40} />
              ) : (
                <Shield size={40} />
              )}
            </motion.div>
          </div>

          {/* Decision Outcome */}
          <div className="space-y-2">
            {stage === 'flipping' ? (
              <p className="text-xs text-zinc-400 font-bold animate-pulse">
                {language === 'ko' ? '운명의 코인이 회전하고 있습니다...' : 'Flipping turn order coin...'}
              </p>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className={`text-base font-black tracking-tight ${isPlayerFirst ? 'text-cyan-300' : 'text-rose-400'}`}>
                  {isPlayerFirst
                    ? (language === 'ko' ? '당신이 선공(FIRST)입니다!' : 'YOU GO FIRST!')
                    : (language === 'ko' ? '상대방이 선공(SECOND)입니다!' : 'OPPONENT GOES FIRST!')}
                </div>

                {/* Second Turn Compensation Banner (Row 1058 / ID 321) */}
                {!isPlayerFirst && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/40 text-[11px] text-amber-300 flex items-center justify-center gap-1.5">
                    <Sparkles size={13} className="text-amber-400 shrink-0" />
                    <span>
                      {language === 'ko'
                        ? '후공 보너스: 첫 턴 패 선택 파워 +1 보정'
                        : 'Second Turn Bonus: +1 Hand Choice Power'}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
