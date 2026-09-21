/**
 * QuestAchievementView.tsx - SCR-11-13, SCR-11-14, SCR-11-15
 * 퀘스트 & 업적 센터 (단일 타이머 워커, 캔버스 오버레이, 별자리 마인드맵, 황금 피냐타 연타)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Star, Sparkles, Trophy, Gift, ArrowRight, Map, 
  Clock, Flame, ChevronRight, ShieldCheck 
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { PageHeader } from '../components/PageHeader';
import { triggerHaptic } from '../lib/haptic';
import { TimerCanvasOverlay } from '../components/TimerCanvasOverlay';
import { QuestConstellationMap, ConstellationNode } from '../components/QuestConstellationMap';
import { WarpTransitionOverlay } from '../components/WarpTransitionOverlay';
import { GoldenPinataModal } from '../components/GoldenPinataModal';

interface QuestAchievementViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason?: string, type?: 'earned' | 'purchased') => void;
  playSfx: (url: string) => void;
  onNavigate: (view: ViewType) => void;
}

export const QuestAchievementView: React.FC<QuestAchievementViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'achievements'>('daily');
  const [isConstellationOpen, setIsConstellationOpen] = useState(false);
  const [isWarpActive, setIsWarpActive] = useState(false);
  const [isPinataOpen, setIsPinataOpen] = useState(false);
  const [warpTargetView, setWarpTargetView] = useState<ViewType>('shop');

  // SCR-11-13: Canvas Timers state
  const [canvasTimers, setCanvasTimers] = useState([
    { id: 'daily_reset', x: 370, y: 15, remainingSeconds: 43200 },
    { id: 'weekly_reset', x: 370, y: 45, remainingSeconds: 259200 },
  ]);

  // Constellation Nodes (SCR-11-14)
  const sampleNodes: ConstellationNode[] = [
    { id: 'q1', title: '초보 헌터의 발걸음', status: 'completed', x: 20, y: 30, connectedTo: ['q2'] },
    { id: 'q2', title: '첫 번째 카드 소환', status: 'completed', x: 50, y: 30, connectedTo: ['q3', 'q4'] },
    { id: 'q3', title: '덱 파워 30 돌파', status: 'active', x: 80, y: 20 },
    { id: 'q4', title: '길드 아지트 방문', status: 'locked', x: 80, y: 50 },
  ];

  // Daily Quests sample
  const dailyQuests = [
    { id: 'dq1', title: '일일 카드 소환 1회 완료', reward: 50, completed: true, claimed: false, target: 'shop' as ViewType },
    { id: 'dq2', title: 'AI 카드 배틀 3회 승리', reward: 100, completed: false, claimed: false, target: 'play' as ViewType },
    { id: 'dq3', title: '길드 아지트 출석 체크', reward: 50, completed: true, claimed: true, target: 'guild-house' as ViewType },
  ];

  const handleWarp = (target: ViewType) => {
    setWarpTargetView(target);
    setIsWarpActive(true);
    triggerHaptic('heavy');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col select-none">
      <PageHeader
        title={language === 'ko' ? '[📜 퀘스트 & 업적 센터]' : '[📜 Quest & Achievement Center]'}
        description={language === 'ko' ? '60fps 캔버스 타이머 & 별자리 연계 퀘스트 맵' : '60fps Canvas Timer & Constellation Quest Map'}
        onBack={() => onNavigate('home')}
        rightElement={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsConstellationOpen(true)}
              className="px-2.5 py-1.5 bg-indigo-500/20 border border-indigo-400 text-indigo-300 text-xs font-black rounded-lg flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Map size={13} />
              <span>별자리 맵</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPinataOpen(true)}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Gift size={13} />
              <span>황금 피냐타</span>
            </button>
          </div>
        }
      />

      {/* Main Container */}
      <div className="flex-1 p-4 max-w-xl mx-auto w-full flex flex-col gap-4">
        {/* Weekly Progress & Timer Bar */}
        <div className="relative p-4 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* SCR-11-13 Canvas Overlay */}
          <TimerCanvasOverlay timers={canvasTimers} />

          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400">주간 퀘스트 달성도 (80%)</span>
              <span className="text-[10px] text-slate-400">초고속 Canvas 타이머</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 w-4/5 rounded-full" />
            </div>
            <span className="text-[10px] text-slate-400">100% 달성 시 [황금 피냐타 축제] 자동 오픈!</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-3 p-1 bg-slate-900 rounded-xl gap-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`py-2 text-xs font-black rounded-lg transition-all ${
              activeTab === 'daily' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            일일 퀘스트
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`py-2 text-xs font-black rounded-lg transition-all ${
              activeTab === 'weekly' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            주간 미션
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={`py-2 text-xs font-black rounded-lg transition-all ${
              activeTab === 'achievements' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            영구 업적
          </button>
        </div>

        {/* Quest List */}
        <div className="flex flex-col gap-2.5">
          {dailyQuests.map((quest) => (
            <div
              key={quest.id}
              className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  {quest.completed ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <Clock size={16} className="text-amber-400" />
                  )}
                  <span className="text-xs font-bold text-white">{quest.title}</span>
                </div>
                <span className="text-[10px] text-amber-300 font-bold block mt-1">
                  보상: +{quest.reward} SNS
                </span>
              </div>

              {quest.claimed ? (
                <span className="px-3 py-1.5 text-[11px] font-black text-slate-500 bg-slate-950 rounded-xl">
                  수령 완료
                </span>
              ) : quest.completed ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('heavy');
                    updateSns(quest.reward, `[퀘스트 완료 보상: ${quest.title}]`);
                    quest.claimed = true;
                  }}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl active:scale-95 cursor-pointer shadow-md"
                >
                  보상 수령
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleWarp(quest.target)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-xl flex items-center gap-1 active:scale-95 cursor-pointer border border-cyan-500/30"
                >
                  <span>바로가기</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SCR-11-14: Quest Constellation Map */}
      <QuestConstellationMap
        isOpen={isConstellationOpen}
        onClose={() => setIsConstellationOpen(false)}
        nodes={sampleNodes}
        onSelectNode={(node) => {
          setIsConstellationOpen(false);
          handleWarp('play');
        }}
      />

      {/* SCR-11-14: Warp Transition Overlay */}
      <WarpTransitionOverlay
        isActive={isWarpActive}
        onFinished={() => {
          setIsWarpActive(false);
          onNavigate(warpTargetView);
        }}
      />

      {/* SCR-11-15: Golden Pinata Mini-game Modal */}
      <GoldenPinataModal
        isOpen={isPinataOpen}
        onClose={() => setIsPinataOpen(false)}
        onFinishGame={(earned) => {
          updateSns(earned, '[황금 피냐타 연타 보상]');
        }}
        onBuyBatPack={() => {
          updateSns(-250, '[다이아몬드 배트 팩 구매]');
        }}
      />
    </div>
  );
};
