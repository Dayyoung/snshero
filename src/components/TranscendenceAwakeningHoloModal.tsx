/**
 * TranscendenceAwakeningHoloModal.tsx - SCR-03-30
 * 카드 최대 성급(초월) 달성 시 전용 '홀로그램 라이브 카드 프레임 & 각성 이펙트' 해금 연출 도입,
 * 성장 재화 부족 시 부족분만 충전해주는 '맞춤형 초월 돌파 다이렉트 팩(1,500원 타임딜)' 스마트 제안 시스템.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Crown, Zap, Gift, X, Check } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface TranscendenceAwakeningHoloModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardName: string;
  cardGrade: string;
  isMaxTranscendence: boolean;
  missingEssenceCount: number;
  onBuyDirectTranscendencePack: () => void;
}

export const TranscendenceAwakeningHoloModal: React.FC<TranscendenceAwakeningHoloModalProps> = ({
  isOpen,
  onClose,
  cardName,
  cardGrade,
  isMaxTranscendence,
  missingEssenceCount,
  onBuyDirectTranscendencePack,
}) => {
  const [hasBoughtDirectPack, setHasBoughtDirectPack] = useState(() => {
    return localStorage.getItem('hero_transcendence_direct_pack') === 'purchased';
  });

  useEffect(() => {
    if (!isOpen) return;
    triggerHaptic('heavy');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = () => {
    triggerHaptic('heavy');
    localStorage.setItem('hero_transcendence_direct_pack', 'purchased');
    setHasBoughtDirectPack(true);
    onBuyDirectTranscendencePack();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Crown size={16} />
            <span>
              {isMaxTranscendence ? '[ 신화 각성: 홀로그램 라이브 프레임 ]' : '[ 초월 돌파 재화 부족 알림 ]'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center cursor-pointer active:scale-95"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {isMaxTranscendence ? (
            /* Hologram Frame Max Transcendence Celebration */
            <>
              {/* Holographic Glowing Card Visual */}
              <div className="relative w-40 h-52 rounded-2xl bg-gradient-to-tr from-cyan-500 via-amber-300 to-fuchsia-500 p-1 shadow-[0_0_35px_rgba(245,158,11,0.6)] animate-pulse">
                <div className="w-full h-full bg-slate-950 rounded-xl flex flex-col items-center justify-center p-2 text-center">
                  <div className="text-4xl animate-bounce">🌟</div>
                  <span className="text-xs font-black text-amber-300 mt-2">{cardName}</span>
                  <span className="text-[9px] text-cyan-300 font-bold">★ 7초월 완전 각성 ★</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-white">홀로그램 라이브 이펙트 해금!</h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  전투 출전 시 고유 등장 컷인과 전장 전체 오라 이펙트가 적용됩니다.
                </p>
              </div>
            </>
          ) : (
            /* Missing Materials Direct Transcendence Pack */
            <>
              <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-500 flex items-center justify-center text-4xl">
                🔮
              </div>

              <div>
                <h3 className="text-sm font-black text-white">초월의 정수가 부족합니다</h3>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {cardName} 초월 돌파에 정수{' '}
                  <strong className="text-rose-400">{missingEssenceCount}개</strong>가 더 필요합니다.
                </p>
              </div>

              {/* Direct Pack Offer (1,500 KRW / 150 SNS Time Deal) */}
              <div className="w-full p-3 bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/40 rounded-xl text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <Gift size={13} /> 맞춤형 초월 돌파 다이렉트 팩
                  </span>
                  <span className="text-[9px] text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-500/30">
                    부족분 즉시 충전
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  초월의 정수 {missingEssenceCount}개 + 50,000 골드 즉시 지급 (1,500원 / 150 SNS)
                </p>
                <div className="flex justify-end pt-1">
                  {hasBoughtDirectPack ? (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <Check size={14} /> 충전 완료
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleBuy}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 text-xs font-black rounded-lg active:scale-95 cursor-pointer shadow"
                    >
                      충전하기
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl active:scale-95 cursor-pointer border border-slate-800"
          >
            확인
          </button>
        </div>
      </motion.div>
    </div>
  );
};
