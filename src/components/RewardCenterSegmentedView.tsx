/**
 * RewardCenterSegmentedView.tsx - SCR-12-26
 * 상단 세그먼트 탭('리워드 센터 / 게임 설정 / 계정') 분리 및 리워드 센터 탭에
 * '1-Tap 쿠폰 붙여넣기 위젯(52px)'과 출석 도장 캘린더를 하단 Thumb Zone에 최적화 배치.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sliders, User, Clipboard, Check, Calendar, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface RewardCenterSegmentedViewProps {
  onRegisterCoupon: (code: string) => boolean;
  onClaimDailyAttendance: (day: number) => void;
  claimedDays: number[];
  todayDay: number;
}

export const RewardCenterSegmentedView: React.FC<RewardCenterSegmentedViewProps> = ({
  onRegisterCoupon,
  onClaimDailyAttendance,
  claimedDays,
  todayDay,
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'settings' | 'account'>('rewards');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);

  const handlePasteCoupon = async () => {
    triggerHaptic('light');
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setCouponCode(text.trim());
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    triggerHaptic('heavy');
    const success = onRegisterCoupon(couponCode.trim());
    if (success) {
      setCouponStatus('쿠폰 보상이 지급되었습니다!');
      setCouponCode('');
    } else {
      setCouponStatus('유효하지 않거나 이미 사용된 쿠폰입니다.');
    }
  };

  return (
    <div className="w-full flex flex-col font-mono select-none">
      {/* 1. Top Segmented Tabs */}
      <div className="w-full grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-3 shadow-inner">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('rewards');
          }}
          className={`h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift size={15} />
          <span>리워드 센터</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('settings');
          }}
          className={`h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders size={15} />
          <span>게임 설정</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('account');
          }}
          className={`h-10 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'account'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User size={15} />
          <span>계정 연동</span>
        </button>
      </div>

      {/* 2. Tab Content */}
      <div className="w-full">
        {activeTab === 'rewards' && (
          <div className="flex flex-col gap-3">
            {/* 1-Tap Coupon Paste & Submit Widget (52px) */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2 shadow-xl">
              <div className="flex items-center justify-between text-xs text-amber-300 font-black">
                <span className="flex items-center gap-1">
                  <Sparkles size={13} />
                  시크릿 쿠폰 등록
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  복사한 쿠폰을 1-Tap으로 붙여넣기
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="쿠폰 코드를 입력하거나 붙여넣기"
                    className="w-full h-12 bg-slate-900 border border-slate-700 rounded-xl px-3 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handlePasteCoupon}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 cursor-pointer"
                    title="클립보드 붙여넣기"
                  >
                    <Clipboard size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="h-12 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs rounded-xl active:scale-95 cursor-pointer shadow hover:brightness-105 shrink-0"
                >
                  등록
                </button>
              </div>

              {couponStatus && (
                <div className="text-[11px] text-amber-400 font-bold px-1 animate-pulse">
                  {couponStatus}
                </div>
              )}
            </div>

            {/* Attendance Calendar in Thumb Zone */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 shadow-xl">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-amber-400" />
                  7일 연속 출석 도장 캘린더
                </span>
                <span className="text-[10px] text-amber-400 font-black">
                  {claimedDays.length} / 7일 완료
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const isClaimed = claimedDays.includes(day);
                  const isToday = day === todayDay;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isClaimed || !isToday}
                      onClick={() => {
                        triggerHaptic('heavy');
                        onClaimDailyAttendance(day);
                      }}
                      className={`h-16 rounded-xl flex flex-col items-center justify-between p-1.5 text-center border transition-all cursor-pointer ${
                        isClaimed
                          ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                          : isToday
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] active:scale-95'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-[9px] font-black">{day}일차</span>
                      <span className="text-base">{isClaimed ? '✓' : day === 7 ? '👑' : '💎'}</span>
                      <span className="text-[8px] font-bold">
                        {isClaimed ? '수령완료' : isToday ? '도장찍기' : `${day * 50}G`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-3">
            <div className="font-bold text-amber-300">⚙️ 오디오 & 그래픽 옵션</div>
            <p className="text-[11px] text-slate-400">
              슬라이더는 오디오 램프 컨트롤러와 연동되어 지직거림 없이 실시간 반영됩니다.
            </p>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-3">
            <div className="font-bold text-amber-300">🔐 계정 보안 & 소셜 연동</div>
            <p className="text-[11px] text-slate-400">
              게스트 계정 유실을 방지하고 보안 강화 페스타 보상을 수령하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
