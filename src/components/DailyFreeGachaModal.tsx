import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';
import { Language } from '../types';
import { triggerHaptic } from '../lib/haptic';

interface DailyFreeGachaModalProps {
 isOpen: boolean;
 onClose: () => void;
 language: Language;
 onClaimFreeGacha: () => void;
 playSfx?: (url: string) => void;
}

export const DailyFreeGachaModal: React.FC<DailyFreeGachaModalProps> = ({
 isOpen,
 onClose,
 language,
 onClaimFreeGacha,
 playSfx,
}) => {
 const [isOpening, setIsOpening] = useState(false);

 if (!isOpen) return null;

 const isKo = language === 'ko';

 const handleClaim = () => {
 if (isOpening) return;
 setIsOpening(true);
 triggerHaptic('victory');
 if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

 setTimeout(() => {
 onClaimFreeGacha();
 setIsOpening(false);
 onClose();
 }, 600);
 };

 return (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#201d1d]/85 font-mono select-none animate-fade-in">
 <div className="relative w-full max-w-sm bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d]/30 rounded-none p-5 text-center overflow-hidden">
 {/* 상단 헤더 */}
 <div className="flex justify-between items-center border-b border-[#201d1d]/15 pb-2 mb-3">
 <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
 <Gift size={14} className="text-amber-600" />
 <span>{isKo ? '[카단 연대기 일일 영웅 보급]' : '[DAILY HERO REQUISITION]'}</span>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="min-h-[44px] p-1 hover:bg-[#201d1d]/10 rounded-sm cursor-pointer"
 >
 <X size={14} />
 </button>
 </div>

 {/* 보급 상자 SVG (Zero-Emoji) */}
 <div className="py-4 space-y-3">
 <div className="w-14 h-14 bg-amber-50 border border-amber-400 rounded-none mx-auto flex items-center justify-center text-amber-700">
 <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
 <rect x="2" y="7" width="20" height="14" rx="0" />
 <path d="M12 7v14" />
 <path d="M2 12h20" />
 <path d="M7 7a2.5 2.5 0 0 1 0-5c2 0 5 5 5 5s3-5 5-5a2.5 2.5 0 0 1 0 5" />
 </svg>
 </div>
 <h3 className="text-sm font-bold text-[#201d1d]">
 {isKo ? '엘윈 원정대 일일 무료 영웅 보급이 도착했습니다!' : 'Daily Free Hero Supply is Ready!'}
 </h3>
 <p className="text-[11px] text-[#201d1d]/70 leading-relaxed">
 {isKo
 ? '매일 1회 수수료 없이 원정 보급 상자를 열고 새로운 영웅 카드를 영입하세요.'
 : 'Pull your free daily snow hero card now with 0 cost!'}
 </p>
 </div>

 {/* 하단 버튼 */}
 <div className="flex gap-2 pt-2">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 min-h-[44px] rounded-sm border border-[#201d1d]/20 bg-transparent hover:bg-[#201d1d]/5 text-xs font-bold"
 >
 {isKo ? '[닫기]' : '[CLOSE]'}
 </button>
 <button
 type="button"
 onClick={handleClaim}
 disabled={isOpening}
 className="flex-2 min-h-[44px] rounded-sm bg-[#201d1d] hover:bg-[#0f0000] text-[#fdfcfc] text-xs font-bold active:scale-95 transition-all"
 >
 {isOpening
 ? (isKo ? '[영웅 소환 중...]' : '[SUMMONING...]')
 : (isKo ? '[영웅 보급 상자 개봉]' : '[OPEN HERO SUPPLY]')}
 </button>
 </div>
 </div>
 </div>
 );
};

export default DailyFreeGachaModal;
export const DailyGuildSummonModal = DailyFreeGachaModal;
