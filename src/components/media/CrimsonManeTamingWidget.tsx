import React, { useState, useEffect, useRef } from 'react';
import {
 CRIMSON_MANE_MOUNT,
 unlockMount,
 isMountUnlocked,
} from '../../utils/mountSystemStore';

interface CrimsonManeTamingWidgetProps {
 onTamingComplete?: () => void;
 onDeployToBattle?: () => void;
 className?: string;
}

export const CrimsonManeTamingWidget: React.FC<CrimsonManeTamingWidgetProps> = ({
 onTamingComplete,
 onDeployToBattle,
 className = '',
}) => {
 const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
 const [isVisible, setIsVisible] = useState<boolean>(true);
 const [isMinimized, setIsMinimized] = useState<boolean>(false);
 const [successCount, setSuccessCount] = useState<number>(0);
 const [gaugePos, setGaugePos] = useState<number>(20); // 0~100
 const [isTamed, setIsTamed] = useState<boolean>(false);
 const [feedback, setFeedback] = useState<string | null>(null);

 const reqRef = useRef<number | null>(null);
 const directionRef = useRef<number>(1);

 useEffect(() => {
 setIsUnlocked(isMountUnlocked(CRIMSON_MANE_MOUNT.id));
 }, []);

 // 60fps gauge sweep animation
 useEffect(() => {
 if (isTamed || isUnlocked || isMinimized || !isVisible) return;

 let pos = 20;
 const animate = () => {
 pos += directionRef.current * 1.4;
 if (pos >= 95) {
 directionRef.current = -1;
 } else if (pos <= 5) {
 directionRef.current = 1;
 }
 setGaugePos(pos);
 reqRef.current = requestAnimationFrame(animate);
 };

 reqRef.current = requestAnimationFrame(animate);
 return () => {
 if (reqRef.current) cancelAnimationFrame(reqRef.current);
 };
 }, [isTamed, isUnlocked, isMinimized, isVisible]);

 if (isUnlocked && !isTamed) return null;
 if (!isVisible) return null;

 // Green Zone is 40% ~ 65%
 const isInsideGreenZone = gaugePos >= 40 && gaugePos <= 65;

 const handleTap = () => {
 if (navigator.vibrate) {
 navigator.vibrate(30);
 }

 if (isInsideGreenZone) {
 const nextCount = successCount + 1;
 setSuccessCount(nextCount);
 setFeedback('PERFECT TIMING! (+1)');
 setTimeout(() => setFeedback(null), 800);

 if (nextCount >= 3) {
 // Taming Success
 unlockMount(CRIMSON_MANE_MOUNT);
 setIsTamed(true);
 if (navigator.vibrate) {
 navigator.vibrate([40, 50, 100]);
 }
 if (onTamingComplete) {
 onTamingComplete();
 }
 }
 } else {
 setFeedback('MISS! TIMING MISSED');
 setTimeout(() => setFeedback(null), 800);
 }
 };

 return (
 <aside
 role="complementary"
 aria-label="Crimson Mane Mount Taming QTE"
 className={`fixed bottom-3 right-3 left-3 sm:left-auto sm:right-4 sm:max-w-md z-40 select-none font-mono ${className}`}
 >
 {isMinimized ? (
 /* Minimized Thin Tab */
 <button
 onClick={() => setIsMinimized(false)}
 className="min-h-[44px] flex items-center space-x-1.5 px-3 py-1.5 bg-[#090d16] hover:bg-[#201d1d] text-stone-200 border border-stone-700 rounded-sm shadow-none transition-colors"
 >
 <span className="text-rose-400 font-bold">[!]</span>
 <span className="text-xs font-bold">[야생의 적갈마 조우 (QTE 대기)]</span>
 </button>
 ) : isTamed ? (
 /* Taming Success Victory Modal Sheet */
 <div className="bg-[#090d16] border border-amber-500/60 rounded-none p-4 text-stone-200 shadow-none space-y-3">
 <div className="flex items-center justify-between border-b border-white/10 pb-2">
 <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
 [EP.08 길들이기 성공 // 전설의 명마 획득]
 </span>
 <button
 onClick={() => setIsVisible(false)}
 className="min-h-[44px] text-stone-400 hover:text-white p-1 rounded-sm"
 >
 [x]
 </button>
 </div>

 <div className="flex items-center space-x-3 p-2.5 bg-stone-950 border border-stone-800 rounded-none">
 <div className="w-10 h-10 bg-stone-900 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
 <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
 <path d="M4 19l4-4 4 1 5-6 3 2v6H4z"></path>
 <circle cx="9" cy="9" r="2"></circle>
 </svg>
 </div>
 <div>
 <div className="text-xs font-bold text-white">
 {CRIMSON_MANE_MOUNT.nameKo}
 </div>
 <div className="text-[11px] text-amber-300 font-semibold mt-0.5">
 고유 특전: 3x3 배틀 턴 선공권(+1) 부여
 </div>
 </div>
 </div>

 <div className="flex space-x-2 pt-1">
 <button
 onClick={() => setIsVisible(false)}
 className="min-h-[44px] flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold rounded-sm border border-stone-700 transition-colors"
 >
 [소설 계속 읽기]
 </button>
 {onDeployToBattle && (
 <button
 onClick={() => {
 setIsVisible(false);
 onDeployToBattle();
 }}
 className="min-h-[44px] flex-1 py-2.5 bg-[#201d1d] hover:bg-stone-800 text-amber-300 text-xs font-bold rounded-sm border border-amber-500/60 transition-colors"
 >
 [명마 탑승 결투 출격]
 </button>
 )}
 </div>
 </div>
 ) : (
 /* Active QTE Interactive Panel */
 <div className="bg-[#090d16] border border-[#646262]/40 rounded-none p-4 text-stone-200 shadow-none space-y-2.5">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-white/10 pb-2">
 <div className="flex items-center space-x-2">
 <span className="text-[10px] text-rose-400 font-bold uppercase">
 [야생의 적갈마 조우 // 고삐 제어 QTE]
 </span>
 </div>
 <div className="flex items-center space-x-1.5">
 <button
 onClick={() => setIsMinimized(true)}
 className="min-h-[44px] text-stone-400 hover:text-white px-1 py-0.5 rounded-xs"
 title="최소화"
 >
 [—]
 </button>
 <button
 onClick={() => setIsVisible(false)}
 className="min-h-[44px] text-stone-400 hover:text-white px-1 py-0.5 rounded-xs"
 title="닫기"
 >
 [x]
 </button>
 </div>
 </div>

 <p className="text-[11px] text-stone-400 leading-snug">
 소설 8화: 질풍처럼 달리는 적갈마의 고삐를 잡으십시오! (녹색 구간 3회 탭 성공 필요)
 </p>

 {/* QTE Timing Bar */}
 <div className="space-y-1">
 <div className="flex justify-between text-[10px] text-stone-400">
 <span>타이밍 게이지</span>
 <span className="text-amber-400 font-bold">성공: {successCount} / 3</span>
 </div>

 <div className="relative w-full h-4 bg-stone-950 border border-stone-800 rounded-none overflow-hidden">
 {/* Green Success Target Zone (40% to 65%) */}
 <div
 className="absolute top-0 bottom-0 bg-emerald-950/80 border-x border-emerald-400/80"
 style={{ left: '40%', width: '25%' }}
 >
 <span className="absolute inset-0 flex items-center justify-center text-[8px] text-emerald-300 font-bold">
 [TAP ZONE]
 </span>
 </div>

 {/* Moving Indicator Needle */}
 <div
 className="absolute top-0 bottom-0 w-1.5 bg-amber-400 shadow-sm transition-none"
 style={{ left: `${gaugePos}%` }}
 />
 </div>
 </div>

 {/* Feedback Text */}
 {feedback && (
 <div
 className={`text-center text-[10px] font-bold ${
 feedback.startsWith('PERFECT') ? 'text-emerald-400' : 'text-rose-400'
 }`}
 >
 {feedback}
 </div>
 )}

 {/* Large Action Button (min-h-[52px]) */}
 <button
 onClick={handleTap}
 className="w-full py-3 bg-[#201d1d] hover:bg-stone-800 active:bg-black text-amber-300 font-bold text-xs rounded-sm border border-stone-700 transition-colors flex items-center justify-center space-x-2 min-h-[52px]"
 >
 <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
 <circle cx="12" cy="12" r="10"></circle>
 <polyline points="12 6 12 12 14 14"></polyline>
 </svg>
 <span>[고삐 제어 타이밍 탭 (녹색 구간)]</span>
 </button>
 </div>
 )}
 </aside>
 );
};

export default CrimsonManeTamingWidget;
