import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Clock, Sparkles, X, Shield, Award } from 'lucide-react';
import { playSfx } from '../lib/sound';

interface ExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onClaimRewards: (snsEarned: number, expEarned: number) => void;
}

interface ExpeditionState {
  isDispatched: boolean;
  dispatchTimestamp: number | null;
  stageName: string;
}

const EXPEDITION_STORAGE_KEY = 'hero_mission_expedition_v1';

export const ExpeditionModal: React.FC<ExpeditionModalProps> = ({
  isOpen,
  onClose,
  language,
  onClaimRewards,
}) => {
  const [expedition, setExpedition] = useState<ExpeditionState>(() => {
    try {
      const saved = localStorage.getItem(EXPEDITION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return { isDispatched: false, dispatchTimestamp: null, stageName: 'Chapter 1: Forest of Trials' };
  });

  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  useEffect(() => {
    if (expedition.isDispatched && expedition.dispatchTimestamp) {
      const now = Date.now();
      const diffMs = Math.max(0, now - expedition.dispatchTimestamp);
      const mins = Math.min(480, Math.floor(diffMs / (1000 * 60))); // Cap at 8 hours (480 mins)
      setElapsedMinutes(mins);
    } else {
      setElapsedMinutes(0);
    }
  }, [isOpen, expedition]);

  const saveExpedition = (state: ExpeditionState) => {
    setExpedition(state);
    localStorage.setItem(EXPEDITION_STORAGE_KEY, JSON.stringify(state));
  };

  const handleDispatch = () => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    const newState: ExpeditionState = {
      isDispatched: true,
      dispatchTimestamp: Date.now(),
      stageName: language === 'ko' ? '제1구역: 시련의 고요한 숲' : 'Sector 1: Silent Forest of Trials',
    };
    saveExpedition(newState);
  };

  const calculatedSns = Math.floor(elapsedMinutes * 0.8) + (elapsedMinutes > 0 ? 10 : 0);
  const calculatedExp = Math.floor(elapsedMinutes * 1.5);
  const clearsCount = Math.floor(elapsedMinutes / 30);

  const handleClaim = () => {
    if (calculatedSns > 0) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      onClaimRewards(calculatedSns, calculatedExp);
    }
    const newState: ExpeditionState = {
      isDispatched: false,
      dispatchTimestamp: null,
      stageName: 'Chapter 1',
    };
    saveExpedition(newState);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-sm bg-[#201d1d] border border-[rgba(255,255,255,0.2)] rounded-none p-4 text-[#fdfcfc] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.12)] pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Compass size={16} className="text-cyan-400 animate-spin-slow" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                [ OFFLINE EXPEDITION PATROL ]
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1 rounded-sm border border-transparent hover:border-white/20"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[10px] text-white/80 mb-3 leading-relaxed">
            {language === 'ko'
              ? '5인 히어로 원정대를 파견하여 최대 8시간 동안 오프라인 상태에서도 30분마다 자동 소탕 보상을 누적합니다.'
              : 'Dispatch a 5-hero squad to patrol cleared stages for up to 8 hours of background offline farming.'}
          </p>

          {/* Patrol Status Box */}
          <div className="bg-[#141212] border border-white/15 p-3 rounded-none mb-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-white/60">{language === 'ko' ? '상태:' : 'Status:'}</span>
              <span className={`font-bold ${expedition.isDispatched ? 'text-emerald-400' : 'text-amber-400'}`}>
                {expedition.isDispatched
                  ? (language === 'ko' ? '[순찰 진행 중]' : '[PATROL IN PROGRESS]')
                  : (language === 'ko' ? '[대기 중]' : '[IDLE / READY]')}
              </span>
            </div>

            {expedition.isDispatched && (
              <>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-white/60 flex items-center gap-1">
                    <Clock size={12} className="text-cyan-300" />
                    {language === 'ko' ? '누적 순찰 시간:' : 'Patrol Duration:'}
                  </span>
                  <span className="font-bold text-white">
                    {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m / 8h
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-none overflow-hidden mb-2">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (elapsedMinutes / 480) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-amber-300 font-bold border-t border-white/10 pt-1.5 flex justify-between">
                  <span>{language === 'ko' ? `누적 소탕: ${clearsCount}회` : `Sweeps: ${clearsCount}`}</span>
                  <span>+{calculatedSns} SNS / +{calculatedExp} EXP</span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {expedition.isDispatched ? (
            <button
              onClick={handleClaim}
              className="w-full py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-emerald-300 transition-colors text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-1.5"
            >
              <Award size={13} />
              <span>{language === 'ko' ? `[ 원정 복귀 및 +${calculatedSns} SNS 수령 ]` : `[ Recall Squad & Claim +${calculatedSns} SNS ]`}</span>
            </button>
          ) : (
            <button
              onClick={handleDispatch}
              className="w-full py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-cyan-300 transition-colors text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-1.5"
            >
              <Shield size={13} />
              <span>{language === 'ko' ? '[ 5인 원정대 8시간 파견 시작 ]' : '[ Dispatch 5-Hero Squad (8h) ]'}</span>
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
