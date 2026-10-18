/**
 * ChampionFestivalModal.tsx - SCR-10-24
 * 시즌 1위 확정 시 황금 폭죽이 터지는 '챔피언 축하 페스티벌' 및 시즌 챔피언 헌정 팩(1,500원)
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Sparkles, X, Check, Flame, Award } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface ChampionFestivalModalProps {
 isOpen: boolean;
 onClose: () => void;
 championNickname: string;
 seasonTitle: string;
 onClaimFestivalGift: () => void;
 onBuyChampionDedicationPack: () => void;
}

export const ChampionFestivalModal: React.FC<ChampionFestivalModalProps> = ({
 isOpen,
 onClose,
 championNickname,
 seasonTitle,
 onClaimFestivalGift,
 onBuyChampionDedicationPack,
}) => {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
 <div className="bg-slate-950 border-2 border-amber-400 rounded-none w-full max-w-sm overflow-hidden shadow-none flex flex-col text-center">
 {/* Header */}
 <div className="p-4 bg-[#201d1d] text-slate-950 flex items-center justify-between">
 <div className="flex items-center gap-1.5 font-black text-xs">
 <Trophy size={16} />
 <span>🏆 챔피언 축하 페스티벌</span>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="w-7 min-h-[44px] rounded-sm bg-black/20 flex items-center justify-center text-slate-950 cursor-pointer"
 >
 <X size={14} />
 </button>
 </div>

 <div className="p-5 flex flex-col items-center gap-4">
 <div className="w-16 h-16 rounded-none bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-3xl shadow-none">
 🎆
 </div>

 <div>
 <div className="text-[10px] text-amber-400 font-bold">{seasonTitle} 정규 시즌 종료</div>
 <h4 className="text-sm font-black text-white mt-1">챔피언: 👑 {championNickname}</h4>
 <p className="text-[11px] text-slate-400 mt-1">
 새로운 전설의 탄생을 축하합니다! 전 서버 유저 모두에게 축하 무료 다이아 선물이 지급됩니다.
 </p>
 </div>

 {/* 48px Action Button */}
 <button
 type="button"
 onClick={() => {
 triggerHaptic('heavy');
 onClaimFestivalGift();
 onClose();
 }}
 className="h-12 w-full bg-[#201d1d] text-slate-950 font-black text-xs rounded-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-none"
 >
 <Award size={16} />
 <span>축하 무료 다이아 수령</span>
 </button>

 {/* Dedication Pack (SCR-10-24) */}
 <div className="w-full p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-none text-left flex items-center justify-between">
 <div>
 <span className="text-xs font-black text-amber-300 block">시즌 챔피언 헌정 팩</span>
 <span className="text-[9px] text-slate-400">챔피언 시그니처 한정 카드 & 전용 오라</span>
 </div>
 <button
 type="button"
 onClick={() => {
 triggerHaptic('medium');
 onBuyChampionDedicationPack();
 onClose();
 }}
 className="min-h-[44px] px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-sm cursor-pointer active:scale-95 shadow"
 >
 구매 (300 SNS)
 </button>
 </div>
 </div>
 </div>
 </div>
 );
};
