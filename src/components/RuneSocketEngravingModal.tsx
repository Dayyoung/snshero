/**
 * RuneSocketEngravingModal.tsx - SCR-03-21
 * 카드에 최대 3개 소켓을 뚫어 특수 패시브 룬을 장착하는 '신화 룬 소켓 각인' 및 황금 대장간 망치 팩(1,500원)
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Hammer, Shield, Zap, X, Check, Flame } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { CardData } from '../types';

interface RuneSocketEngravingModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardData | null;
  onEngraveRune: (slotIndex: number, runeType: string) => void;
  onBuyHammerPack: () => void;
}

export const RuneSocketEngravingModal: React.FC<RuneSocketEngravingModalProps> = ({
  isOpen,
  onClose,
  card,
  onEngraveRune,
  onBuyHammerPack,
}) => {
  const [activeSockets, setActiveSockets] = useState<[string | null, string | null, string | null]>([
    '치명타 +5%',
    null,
    null,
  ]);

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs">
            <Hammer size={16} />
            <span>🔨 신화 룬 소켓 각인 대장간</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-slate-950 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-3xl shadow-lg">
            ⚡
          </div>

          <div>
            <h4 className="text-sm font-black text-white">{card.title_dis || card.id}</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              최대 3개의 신화 룬 소켓을 뚫어 공격력 증폭, 흡혈, 연속 행동 등의 특수 패시브를 각인할 수 있습니다.
            </p>
          </div>

          {/* 3 Socket Slots */}
          <div className="flex items-center gap-3">
            {activeSockets.map((rune, idx) => (
              <div
                key={idx}
                onClick={() => {
                  triggerHaptic('selection');
                  if (!rune) {
                    const next = [...activeSockets] as [string | null, string | null, string | null];
                    next[idx] = idx === 1 ? '방어력 +8%' : '흡혈 +6%';
                    setActiveSockets(next);
                    onEngraveRune(idx, next[idx]!);
                  }
                }}
                className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition active:scale-95 ${
                  rune
                    ? 'bg-amber-950/40 border-amber-400 text-amber-300 shadow-md'
                    : 'bg-slate-900 border-slate-750 border-dashed text-slate-500 hover:border-slate-600'
                }`}
              >
                {rune ? (
                  <>
                    <Sparkles size={16} className="text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-center leading-tight">{rune}</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg text-slate-600">+</span>
                    <span className="text-[9px] text-slate-500 mt-0.5">슬롯 {idx + 1}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Golden Blacksmith Hammer Pack (SCR-03-21) */}
          <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between mt-1">
            <div>
              <span className="text-xs font-black text-amber-300 block">황금 대장간 망치 팩</span>
              <span className="text-[9px] text-slate-400">소켓 100% 즉시 확장 & 전설 룬 1개 동봉</span>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('heavy');
                onBuyHammerPack();
                onClose();
              }}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer active:scale-95 shadow"
            >
              구매 (300 SNS)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
