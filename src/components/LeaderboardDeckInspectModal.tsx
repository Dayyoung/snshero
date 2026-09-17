/**
 * LeaderboardDeckInspectModal.tsx
 * 리더보드 랭커 5장 덱 구성 인스펙트 및 메타 전술 분석 모달
 * (백로그 ID 460: 리더보드 랭커 덱 구성 인스펙트 팝업)
 */

import React from 'react';
import { Shield, Swords, Sparkles, X, Trophy } from 'lucide-react';
import { CardData } from '../types';
import { CARD_DATABASE } from '../cardDatabase';

interface LeaderboardDeckInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankerName: string;
  rank: number;
  totalPower: number;
  winRate: number;
  deck?: CardData[];
  language?: string;
}

export const LeaderboardDeckInspectModal: React.FC<LeaderboardDeckInspectModalProps> = ({
  isOpen,
  onClose,
  rankerName,
  rank,
  totalPower,
  winRate,
  deck,
  language = 'ko',
}) => {
  if (!isOpen) return null;
  const isKo = language === 'ko';

  // 덱이 주어지지 않은 경우 DB 기반 상위 5장 자동 생성
  const displayDeck: CardData[] = (deck && deck.length === 5)
    ? deck
    : [CARD_DATABASE[1] || { id: 1, name: 'Dragon Master', power: 9, element: 'FIRE' },
       CARD_DATABASE[2] || { id: 2, name: 'Ocean Leviathan', power: 8, element: 'WATER' },
       CARD_DATABASE[3] || { id: 3, name: 'Terra Titan', power: 8, element: 'EARTH' },
       CARD_DATABASE[4] || { id: 4, name: 'Sky Gryphon', power: 7, element: 'WIND' },
       CARD_DATABASE[5] || { id: 5, name: 'Solar Phoenix', power: 9, element: 'FIRE' }] as unknown as CardData[];

  // 메타 전술 분석 (공격형/밸런스형/방어형)
  const avgPower = Math.round(displayDeck.reduce((acc, c) => acc + (c.power || 5), 0) / displayDeck.length);
  const playStyle = avgPower >= 8
    ? (isKo ? '고화력 압박형 (Aggro Rush)' : 'Aggro Rush')
    : (avgPower >= 6 ? (isKo ? '속성 밸런스형 (Balanced Meta)' : 'Balanced Meta') : (isKo ? '지구전 방어형 (Control Deck)' : 'Control Deck'));

  return (
    <div className="fixed inset-0 z-[10030] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 p-5 rounded-none max-w-md w-full shadow-2xl space-y-4 text-[#201d1d] dark:text-[#fdfcfc]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <h3 className="font-black text-sm uppercase tracking-wider">
              {isKo ? `랭커 덱 분석 (Rank #${rank})` : `Ranker Deck (#${rank})`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#201d1d]/5 dark:hover:bg-white/5 cursor-pointer text-xs"
          >
            [x]
          </button>
        </div>

        {/* Ranker Info */}
        <div className="flex items-center justify-between bg-[#201d1d]/5 dark:bg-white/5 p-3 border border-[#201d1d]/10 dark:border-white/10 text-xs">
          <div>
            <div className="font-black text-sm text-amber-600 dark:text-amber-400">{rankerName}</div>
            <div className="text-[10px] opacity-75 mt-0.5">
              {isKo ? `승률 ${winRate}% | 전투력 ${totalPower.toLocaleString()}` : `WinRate ${winRate}% | Power ${totalPower.toLocaleString()}`}
            </div>
          </div>
          <div className="text-right">
            <span className="px-2 py-0.5 bg-amber-500 text-stone-950 font-black text-[10px] uppercase">
              {playStyle}
            </span>
          </div>
        </div>

        {/* 5-Card Deck Grid */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold opacity-75">
            {isKo ? '출전 5장 덱 편성' : 'Battle Lineup (5 Cards)'}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {displayDeck.map((card, idx) => (
              <div
                key={card.id || idx}
                className="bg-[#201d1d]/5 dark:bg-white/5 border border-[#201d1d]/20 dark:border-white/20 p-2 text-center rounded-none relative flex flex-col items-center justify-center min-h-[72px]"
              >
                <div className="text-[9px] font-bold text-amber-500">{card.element || 'FIRE'}</div>
                <div className="text-sm font-black my-1">{card.power || 7}</div>
                <div className="text-[8px] font-mono truncate w-full opacity-80">{card.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Meta Insights */}
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-900 dark:text-cyan-200 space-y-1">
          <div className="font-bold flex items-center gap-1">
            <Sparkles size={12} className="text-cyan-500" />
            <span>{isKo ? '메타 분석 인사이트' : 'Meta Strategic Insight'}</span>
          </div>
          <p className="text-[10px] opacity-90 leading-snug">
            {isKo
              ? `이 랭커는 평균 전투력 ${avgPower}로 초중반 그리드 주도권을 빠르게 장악하는 전략을 구사합니다. 상성 우위 타일을 먼저 선점하는 전술을 추천합니다.`
              : `This ranker plays an aggressive mid-range strategy with Avg Power ${avgPower}. Counter by claiming adjacent elemental advantage slots early.`}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-[#201d1d] text-[#fdfcfc] dark:bg-white dark:text-[#201d1d] font-bold text-xs cursor-pointer hover:opacity-90 active:scale-98"
        >
          {isKo ? '닫기' : 'Close'}
        </button>
      </div>
    </div>
  );
};
