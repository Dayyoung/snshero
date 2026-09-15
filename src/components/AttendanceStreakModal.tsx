/**
 * AttendanceStreakModal.tsx
 * 7일 연속 출석 스트릭(Streak) 보상 및 월 1회 스트릭 복구권(Streak Saver) 모달
 * (구글 스프레드시트 Row 1065 / ID 328 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { CalendarCheck, Flame, ShieldAlert, Award, CheckCircle2, RotateCcw } from 'lucide-react';
import { playBattleSfx } from '../lib/AudioSpriteService';

interface AttendanceStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimReward: (points: number) => void;
  language?: string;
}

interface AttendanceState {
  lastCheckDate: string;
  currentStreak: number;
  streakSaverUsedThisMonth: boolean;
  completedMissionsToday: number;
}

const STORAGE_KEY = 'hero_attendance_streak_v1';

export const AttendanceStreakModal: React.FC<AttendanceStreakModalProps> = ({
  isOpen,
  onClose,
  onClaimReward,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const todayStr = new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'normal' | 'return_user'>('normal');

  // ID 573: 72시간 미접속 복귀 유저 7일 웰컴 트랙 상태
  const [returnUserState, setReturnUserState] = useState<{
    currentDay: number;
    claimedDays: number[];
    lastClaimDate: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('hero_return_user_welcome_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      currentDay: 1,
      claimedDays: [],
      lastClaimDate: '',
    };
  });

  const [state, setState] = useState<AttendanceState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      lastCheckDate: '',
      currentStreak: 1,
      streakSaverUsedThisMonth: false,
      completedMissionsToday: 3, // 기본 3개 완료 시뮬레이션
    };
  });

  const isCheckedToday = state.lastCheckDate === todayStr;

  // 7일간의 일반 출석 보상
  const streakRewards = [
    { day: 1, multiplier: '1.0x', points: 50 },
    { day: 2, multiplier: '1.2x', points: 60 },
    { day: 3, multiplier: '1.4x', points: 70 },
    { day: 4, multiplier: '1.6x', points: 80 },
    { day: 5, multiplier: '1.8x', points: 90 },
    { day: 6, multiplier: '2.0x', points: 100 },
    { day: 7, multiplier: '3.0x', points: 150 },
  ];

  // ID 573: 72시간 이상 미접속 복귀 유저 7일 웰컴 트랙 보상 정의 (Day 3: SSR 선택권)
  const returnUserRewards = [
    { day: 1, titleKo: '100 SNS', titleEn: '100 SNS', reward: 100, isSpecial: false },
    { day: 2, titleKo: '150 SNS', titleEn: '150 SNS', reward: 150, isSpecial: false },
    { day: 3, titleKo: '🌟 SSR 카드 선택권', titleEn: '🌟 SSR Selector', reward: 500, isSpecial: true },
    { day: 4, titleKo: '200 SNS', titleEn: '200 SNS', reward: 200, isSpecial: false },
    { day: 5, titleKo: '🎨 에픽 슬리브', titleEn: '🎨 Epic Sleeve', reward: 250, isSpecial: false },
    { day: 6, titleKo: '300 SNS', titleEn: '300 SNS', reward: 300, isSpecial: false },
    { day: 7, titleKo: '👑 500 SNS + 레전드팩', titleEn: '👑 500 SNS + Legend Pack', reward: 500, isSpecial: true },
  ];

  if (!isOpen) return null;

  const currentDayIndex = Math.min(6, Math.max(0, state.currentStreak - 1));
  const todayReward = streakRewards[currentDayIndex];

  const handleCheckIn = () => {
    if (isCheckedToday) return;

    playBattleSfx('victory');
    const nextStreak = state.currentStreak >= 7 ? 1 : state.currentStreak + 1;
    const newState: AttendanceState = {
      ...state,
      lastCheckDate: todayStr,
      currentStreak: nextStreak,
    };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    onClaimReward(todayReward.points);
  };

  const handleRestoreStreak = () => {
    if (state.streakSaverUsedThisMonth) return;

    playBattleSfx('badge_pop');
    const newState: AttendanceState = {
      ...state,
      currentStreak: Math.min(7, state.currentStreak + 2),
      streakSaverUsedThisMonth: true,
    };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  // ID 573: 복귀 유저 당일 보상 수령
  const handleClaimReturnUserDay = (day: number, reward: number) => {
    if (returnUserState.claimedDays.includes(day)) return;
    playBattleSfx('victory');

    const nextClaimed = [...returnUserState.claimedDays, day];
    const nextState = {
      ...returnUserState,
      claimedDays: nextClaimed,
      currentDay: Math.min(7, day + 1),
      lastClaimDate: todayStr,
    };
    setReturnUserState(nextState);
    localStorage.setItem('hero_return_user_welcome_v1', JSON.stringify(nextState));
    onClaimReward(reward);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 font-mono select-none">
      <div className="w-full max-w-md bg-[#fdfcfc] border-2 border-[#201d1d] text-[#201d1d] p-5 shadow-[4px_4px_0px_#201d1d]">
        {/* 탭 헤더 */}
        <div className="flex border-b border-[#201d1d] mb-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('normal')}
            className={`px-3 py-1.5 text-xs font-bold border-t border-x border-[#201d1d] -mb-[1px] transition-all ${
              activeTab === 'normal' ? 'bg-[#201d1d] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {isKo ? '📅 연속 출석 스트릭' : '📅 Login Streak'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('return_user')}
            className={`px-3 py-1.5 text-xs font-bold border-t border-x border-[#201d1d] -mb-[1px] transition-all flex items-center gap-1 ${
              activeTab === 'return_user' ? 'bg-[#201d1d] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <span>🌟</span>
            <span>{isKo ? '72h 복귀 웰컴 (Day 3 SSR)' : '72h Welcome Track'}</span>
          </button>
        </div>

        {activeTab === 'normal' ? (
          <>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 border border-amber-300 text-amber-800">
                  <CalendarCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">
                    {isKo ? '7일 연속 출석 스트릭 (Streak)' : '7-Day Login Streak Track'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {isKo ? `현재 연속 ${state.currentStreak}일 접속 중!` : `Current Streak: Day ${state.currentStreak}`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-stone-400 hover:text-[#201d1d] font-bold text-sm">
                ✕
              </button>
            </div>

        {/* 7일 연속 출석 캘린더 그리드 */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {streakRewards.map((reward, i) => {
            const isCompleted = i < currentDayIndex || (isCheckedToday && i === currentDayIndex);
            const isCurrent = i === currentDayIndex && !isCheckedToday;

            return (
              <div
                key={reward.day}
                className={`p-1.5 flex flex-col items-center justify-between text-center border text-[10px] ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : isCurrent
                    ? 'bg-amber-100 border-amber-500 font-bold text-amber-950 scale-105 shadow-xs'
                    : 'bg-[#f8f7f5] border-[rgba(15,0,0,0.1)] text-stone-400'
                }`}
              >
                <span className="font-bold">{reward.day}D</span>
                <div className="my-1">
                  {isCompleted ? (
                    <CheckCircle2 size={14} className="text-emerald-600 mx-auto" />
                  ) : (
                    <Flame size={14} className={isCurrent ? 'text-amber-600 animate-pulse' : 'text-stone-300'} />
                  )}
                </div>
                <span className="text-[9px] font-black">{reward.multiplier}</span>
                <span className="text-[9px] text-stone-500">+{reward.points}</span>
              </div>
            );
          })}
        </div>

        {/* 스트릭 세이버 (Streak Saver) 복구권 */}
        <div className="p-3 bg-stone-50 border border-stone-200 mb-4 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-[#201d1d] flex items-center gap-1">
              <RotateCcw size={12} className="text-blue-600" />
              {isKo ? '월 1회 스트릭 세이버 (Streak Saver)' : 'Monthly Streak Saver'}
            </span>
            <span className={`text-[10px] font-bold ${state.streakSaverUsedThisMonth ? 'text-stone-400' : 'text-emerald-600'}`}>
              {state.streakSaverUsedThisMonth ? (isKo ? '이번 달 소진' : 'Used') : (isKo ? '1회 보유 중' : 'Available')}
            </span>
          </div>
          <p className="text-[11px] text-stone-600 mb-2">
            {isKo
              ? '접속을 놓쳐 스트릭이 끊겼을 때, 일일 미션 3개 완료 후 스트릭을 즉시 복구할 수 있습니다.'
              : 'Restore an interrupted streak once a month after completing 3 daily missions.'}
          </p>
          {!state.streakSaverUsedThisMonth && (
            <button
              onClick={handleRestoreStreak}
              disabled={state.completedMissionsToday < 3}
              className="py-1 px-3 bg-white text-stone-800 border border-stone-300 font-bold text-[11px] hover:bg-stone-100 disabled:opacity-40"
            >
              {isKo ? '끊긴 스트릭 즉시 복구하기' : 'Restore Broken Streak'}
            </button>
          )}
        </div>

        {/* 오늘 출석 완료 / 체크인 버튼 */}
        <button
          onClick={handleCheckIn}
          disabled={isCheckedToday}
          className="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs border border-black hover:bg-black active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isCheckedToday
            ? isKo ? '오늘 출석 완료 (수령됨)' : 'Already Checked In Today'
            : isKo ? `오늘의 출석 보상 받기 (+${todayReward.points} SNS)` : `Claim Today's Bonus (+${todayReward.points} SNS)`}
        </button>
          </>
        ) : (
          /* ID 573: 72시간 복귀 유저 7일 웰컴 트랙 뷰 (Day 3 SSR 카드 선택권) */
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                <span>🌟</span>
                <span>{isKo ? '72시간 이상 미접속 복귀 사령관 특별 웰컴 트랙' : 'Welcome Back Commander! 7-Day Reward Track'}</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {isKo
                  ? 'SNS히어로 복귀를 진심으로 환영합니다! 3일차 출석 시 SSR 영웅 카드 선택권이 확정 지급됩니다.'
                  : 'Welcome back to SNSHero! Day 3 guarantees an SSR Hero Card Selection Ticket.'}
              </p>
            </div>

            {/* 7일 웰컴 트랙 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {returnUserRewards.map((reward) => {
                const isClaimed = returnUserState.claimedDays.includes(reward.day);
                const isCurrent = reward.day === returnUserState.currentDay && returnUserState.lastClaimDate !== todayStr;

                return (
                  <div
                    key={reward.day}
                    className={`p-1.5 flex flex-col items-center justify-between text-center border text-[9px] ${
                      isClaimed
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : isCurrent
                          ? 'bg-amber-100 border-amber-500 font-black text-amber-950 scale-105 shadow-xs animate-pulse'
                          : reward.isSpecial
                            ? 'bg-purple-50 border-purple-400 text-purple-900'
                            : 'bg-stone-50 border-stone-200 text-stone-500'
                    }`}
                  >
                    <span className="font-bold">{reward.day}D</span>
                    <div className="my-1 text-base">
                      {isClaimed ? '✅' : reward.isSpecial ? '🌟' : '🎁'}
                    </div>
                    <span className="font-bold truncate max-w-full text-[8px]">{isKo ? reward.titleKo : reward.titleEn}</span>
                  </div>
                );
              })}
            </div>

            {/* 당일 복귀 보상 수령 버튼 */}
            {(() => {
              const curDay = returnUserState.currentDay;
              const curReward = returnUserRewards.find(r => r.day === curDay);
              const alreadyClaimedToday = returnUserState.lastClaimDate === todayStr;

              return (
                <button
                  type="button"
                  disabled={alreadyClaimedToday || !curReward}
                  onClick={() => curReward && handleClaimReturnUserDay(curDay, curReward.reward)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs border border-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  {alreadyClaimedToday
                    ? (isKo ? '오늘의 복귀 보상 수령 완료' : 'Claimed for Today')
                    : (isKo ? `Day ${curDay} 복귀 보상 받기 (+${curReward?.reward} SNS)` : `Claim Day ${curDay} Reward (+${curReward?.reward} SNS)`)}
                </button>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
