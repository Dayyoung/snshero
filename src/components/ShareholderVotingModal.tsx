import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Zap, CheckCircle2, X, Vote, ShieldCheck, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { Language } from '../types';

interface ShareholderVotingModalProps {
  language: Language;
  userSns: number;
  totalHeldStocks: number;
  currentSeason: string;
  isDoubleDividendActive: boolean;
  onActivateDoubleDividend: () => void;
  onVoteComplete: (agendaId: string, choice: 'yes' | 'no', reward: number) => void;
  onClose: () => void;
}

interface Agenda {
  id: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  yesPct: number;
  noPct: number;
}

const AGENDAS: Agenda[] = [
  {
    id: 'agenda-1',
    titleKo: '제1호: 시즌 1 차기 테마 덱 신규 드래곤 카드 사전 상장 승인의 건',
    titleEn: 'No. 1: Advance Listing of New Dragon Cards for Season 1 Theme Deck',
    descKo: '마켓 유동성 공급과 거래량 활성화를 위해 신규 골드 드래곤 카드를 주식 시장에 우선 출시합니다.',
    descEn: 'Prioritize launching new gold dragon cards on the stock market to increase liquidity.',
    yesPct: 88,
    noPct: 12,
  },
  {
    id: 'agenda-2',
    titleKo: '제2호: 주식 거래 수수료 50% 특별 인하안 (0.75% -> 0.375%)',
    titleEn: 'No. 2: Special 50% Trading Fee Reduction Proposal (0.75% -> 0.375%)',
    descKo: '소액 주주들의 적극적인 트레이딩을 지원하기 위해 거래 수수료를 50% 추가 인하합니다.',
    descEn: 'Further cut trading fees by 50% to encourage active trading for minor shareholders.',
    yesPct: 94,
    noPct: 6,
  },
  {
    id: 'agenda-3',
    titleKo: '제3호: 주간 배당 풀 +50,000 SNS 특별 증액 및 분배의 건',
    titleEn: 'No. 3: Special Allocation of +50,000 SNS to Weekly Dividend Pool',
    descKo: '플랫폼 운영 수익금 일부를 주주 환원 특별 배당 풀로 전환하여 주주 전원에게 균등 증액 지급합니다.',
    descEn: 'Convert part of platform revenue into a shareholder dividend pool for higher weekly payouts.',
    yesPct: 97,
    noPct: 3,
  },
];

export const ShareholderVotingModal: React.FC<ShareholderVotingModalProps> = ({
  language,
  userSns,
  totalHeldStocks,
  currentSeason,
  isDoubleDividendActive,
  onActivateDoubleDividend,
  onVoteComplete,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'voting' | 'booster'>('voting');
  const [votedAgendas, setVotedAgendas] = useState<Record<string, 'yes' | 'no'>>(() => {
    try {
      const saved = localStorage.getItem(`hero_shareholder_votes_${currentSeason}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const votingPower = Math.max(1, totalHeldStocks * 10); // 1주당 10표

  const handleVote = (agendaId: string, choice: 'yes' | 'no') => {
    if (votedAgendas[agendaId]) return;

    triggerHaptic('success');
    const next = { ...votedAgendas, [agendaId]: choice };
    setVotedAgendas(next);
    try {
      localStorage.setItem(`hero_shareholder_votes_${currentSeason}`, JSON.stringify(next));
    } catch {}

    const reward = 50;
    onVoteComplete(agendaId, choice, reward);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none font-mono">
      <div
        className="w-full max-w-md bg-[#fdfcfc] border-2 border-[#201d1d] p-5 shadow-[4px_4px_0px_#201d1d] space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Vote size={18} className="text-[#201d1d]" />
            <div>
              <h3 className="font-black text-sm text-[#201d1d]">
                {language === 'ko' ? '주주총회 & 배당 부스터' : 'Shareholder Assembly'}
              </h3>
              <span className="text-[10px] text-[#646262]">
                {language === 'ko'
                  ? `내 의결권: ${votingPower.toLocaleString()}표 (${totalHeldStocks}주 보유)`
                  : `Voting Power: ${votingPower.toLocaleString()} votes`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#646262] hover:text-[#201d1d] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] shrink-0 text-xs">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('voting');
            }}
            className={`py-2 font-bold cursor-pointer transition-colors ${
              activeTab === 'voting'
                ? 'bg-[#201d1d] text-[#fdfcfc]'
                : 'text-[#646262] hover:bg-[#eae8e8]'
            }`}
          >
            {language === 'ko' ? '주주총회 안건 투표' : 'Agenda Voting'}
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('booster');
            }}
            className={`py-2 font-bold cursor-pointer transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'booster'
                ? 'bg-[#201d1d] text-[#fdfcfc]'
                : 'text-[#646262] hover:bg-[#eae8e8]'
            }`}
          >
            <Sparkles size={13} className="text-amber-500" />
            <span>{language === 'ko' ? '배당 2배 부스터' : '2x Dividend'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {activeTab === 'voting' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-950 text-[11px] leading-relaxed">
                {language === 'ko'
                  ? '🗳️ 각 안건에 찬성/반대 투표를 완료하면 주주 참여 감사금 +50 SNS가 즉시 지급됩니다.'
                  : '🗳️ Vote on proposals to earn +50 SNS participation bonus for each agenda.'}
              </div>

              {AGENDAS.map((agenda) => {
                const myVote = votedAgendas[agenda.id];
                return (
                  <div
                    key={agenda.id}
                    className="p-3 bg-white border border-[rgba(15,0,0,0.12)] space-y-2.5 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <h4 className="font-black text-xs text-[#201d1d]">
                        {language === 'ko' ? agenda.titleKo : agenda.titleEn}
                      </h4>
                      <p className="text-[10px] text-[#646262] leading-relaxed">
                        {language === 'ko' ? agenda.descKo : agenda.descEn}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-rose-100 overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${agenda.yesPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-[#8c8989]">
                        <span className="text-emerald-700">
                          {language === 'ko' ? '찬성' : 'Yes'} {agenda.yesPct}%
                        </span>
                        <span className="text-rose-700">
                          {language === 'ko' ? '반대' : 'No'} {agenda.noPct}%
                        </span>
                      </div>
                    </div>

                    {/* Voting Action */}
                    {myVote ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-900 text-center font-bold text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle2 size={13} />
                        <span>
                          {language === 'ko'
                            ? `투표 완료: [${myVote === 'yes' ? '찬성' : '반대'}] (+50 SNS 수령 완료)`
                            : `Voted: [${myVote.toUpperCase()}] (+50 SNS Claimed)`}
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleVote(agenda.id, 'yes')}
                          className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
                        >
                          👍 {language === 'ko' ? '찬성 투표' : 'Vote YES'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVote(agenda.id, 'no')}
                          className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
                        >
                          👎 {language === 'ko' ? '반대 투표' : 'Vote NO'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'booster' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-400 text-stone-950 space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h4 className="font-black text-sm text-[#201d1d]">
                      {language === 'ko' ? '주간 배당 2배 부스터 (7일권)' : 'Weekly 2x Dividend Booster (7D)'}
                    </h4>
                    <span className="text-[10px] text-amber-800 font-bold">
                      {language === 'ko' ? '모든 보유 주식 배당금 100% 추가 뻥튀기 지급' : 'Double your weekly dividend earnings'}
                    </span>
                  </div>
                </div>

                <ul className="text-[11px] text-[#646262] space-y-1.5 list-disc list-inside">
                  <li>{language === 'ko' ? '주식 시장에서 수령하는 모든 캐릭터 배당금 2배' : 'All character stock dividends doubled'}</li>
                  <li>{language === 'ko' ? '배당금 1-Tap 재투자 시에도 2배 증액된 물량 지급' : 'Doubled shares on 1-Tap dividend reinvestment'}</li>
                  <li>{language === 'ko' ? '활성화 즉시 7일간 무제한 자동 적용' : 'Active for 7 days upon activation'}</li>
                </ul>

                <div className="pt-2 border-t border-amber-300/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#646262] block">
                      {language === 'ko' ? '이용권 가격' : 'Price'}
                    </span>
                    <span className="font-black text-sm text-indigo-700">300 SNS</span>
                  </div>

                  {isDoubleDividendActive ? (
                    <span className="px-3 py-2 bg-emerald-600 text-white font-black text-xs flex items-center gap-1 shadow-xs">
                      <ShieldCheck size={14} />
                      <span>{language === 'ko' ? '현재 2배 적용 중' : 'Active'}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (userSns < 300) {
                          triggerHaptic('warning');
                          alert(language === 'ko' ? 'SNS 포인트가 부족합니다 (300 SNS 필요)' : 'Insufficient SNS (300 SNS required)');
                          return;
                        }
                        triggerHaptic('victory');
                        onActivateDoubleDividend();
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
                    >
                      {language === 'ko' ? '300 SNS로 부스터 활성화' : 'Activate (300 SNS)'}
                    </button>
                  )}
                </div>
              </div>

              {isDoubleDividendActive && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] text-center font-bold">
                  ✨ {language === 'ko' ? '배당 2배 부스터가 활성화되어 있습니다! 배당 수령 탭에서 2배로 정산됩니다.' : '2x Booster is active! Enjoy double dividend payouts.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[rgba(15,0,0,0.08)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] font-black text-xs cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            {language === 'ko' ? '닫기' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
