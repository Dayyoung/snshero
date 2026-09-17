/**
 * ShortfallGuideModal.tsx
 * ID 393: 상점 재화 부족 시 무료 획득 경로 안내 및 즉시 이동 숏컷 모달
 */

import React from 'react';
import { X, Sparkles, Compass, CheckCircle2, Users, Swords, Gift, ArrowRight } from 'lucide-react';
import { Language, ViewType } from '../types';

interface ShortfallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredSns: number;
  currentSns: number;
  onNavigate: (view: ViewType) => void;
  language: Language;
}

export const ShortfallGuideModal: React.FC<ShortfallGuideModalProps> = ({
  isOpen,
  onClose,
  requiredSns,
  currentSns,
  onNavigate,
  language,
}) => {
  if (!isOpen) return null;

  const deficit = Math.max(0, requiredSns - currentSns);

  const routes: Array<{
    titleKo: string;
    titleEn: string;
    descKo: string;
    descEn: string;
    reward: string;
    view: ViewType;
    icon: React.ReactNode;
  }> = [
    {
      titleKo: '일일 미션 & 시즌 퀘스트',
      titleEn: 'Daily Missions & Quests',
      descKo: '간단한 일일 목표 달성 시 즉시 지급',
      descEn: 'Instant reward on simple daily clears',
      reward: '+50 ~ 200 SNS',
      view: 'play',
      icon: <CheckCircle2 size={16} className="text-emerald-400" />,
    },
    {
      titleKo: '메인 스토리 카드 배틀',
      titleEn: 'Main Story Battle',
      descKo: '챕터별 AI 대전 승리 보너스',
      descEn: 'Win chapter battles for SNS bonus',
      reward: '+20 ~ 50 SNS',
      view: 'main',
      icon: <Swords size={16} className="text-rose-400" />,
    },
    {
      titleKo: '친구 초대 리퍼럴 보상',
      titleEn: 'Friend Referral Rewards',
      descKo: '친구 초대 코드 등록 시 즉시 적립',
      descEn: 'Instant bonus per invited friend',
      reward: '+200 SNS',
      view: 'referral',
      icon: <Users size={16} className="text-indigo-400" />,
    },
    {
      titleKo: '부지런의 나무 & 일일 출석',
      titleEn: 'Diligence Tree & Daily Check',
      descKo: '매일 시간 경과에 따라 무료 수확',
      descEn: 'Free harvest as time passes daily',
      reward: '+30 ~ 100 SNS',
      view: 'home',
      icon: <Gift size={16} className="text-amber-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-sm w-full max-w-md p-5 text-slate-100 font-mono space-y-4 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {language === 'ko' ? 'SNS 포인트 부족 안내' : 'Insufficient SNS Points'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-sm hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortfall Summary */}
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-sm flex items-center justify-between text-xs">
          <div>
            <span className="text-rose-300 block font-bold">
              {language === 'ko' ? '부족한 재화:' : 'Shortfall Deficit:'}
            </span>
            <span className="text-[10px] text-slate-400">
              보유 {currentSns.toLocaleString()} / 필요 {requiredSns.toLocaleString()} SNS
            </span>
          </div>
          <span className="text-base font-black text-rose-400 font-mono">
            -{deficit.toLocaleString()} SNS
          </span>
        </div>

        {/* Free Earning Routes List */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'ko' ? '무료 즉시 획득 파밍처 (1-Tap 이동)' : 'Free Fast Farming Routes (1-Tap)'}
          </span>

          <div className="space-y-2">
            {routes.map((route, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate(route.view);
                }}
                className="w-full p-2.5 rounded-sm border border-slate-800 bg-slate-950 hover:bg-slate-850 hover:border-indigo-500/60 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xs bg-slate-900 border border-slate-700">
                    {route.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white">
                      {language === 'ko' ? route.titleKo : route.titleEn}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {language === 'ko' ? route.descKo : route.descEn}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-amber-400 font-mono">
                    {route.reward}
                  </span>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm font-bold text-xs transition-colors cursor-pointer"
          >
            {language === 'ko' ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
