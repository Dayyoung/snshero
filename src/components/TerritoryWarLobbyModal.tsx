/**
 * TerritoryWarLobbyModal.tsx - SCR-09-15
 * 주간 4대 길드 영지 쟁탈전 로비 & 샴페인 축하 파티팩 모달
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Trophy, Sparkles, X, Shield, Users, Clock, Flame, PartyPopper } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface TerritoryWarLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  guildName: string;
  onStartBattle: (nodeName: string) => void;
  onBuyChampagnePack: () => void;
}

export const TerritoryWarLobbyModal: React.FC<TerritoryWarLobbyModalProps> = ({
  isOpen,
  onClose,
  guildName,
  onStartBattle,
  onBuyChampagnePack,
}) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'party'>('nodes');
  const [showChampagneFx, setShowChampagneFx] = useState(false);

  if (!isOpen) return null;

  const territoryNodes = [
    { id: 'node_1', name: '고대 태양의 신전', occupiedBy: guildName, defenseBuff: '+20% ATK', points: 1500 },
    { id: 'node_2', name: '달빛 수정 광산', occupiedBy: '섀도우 팽 길드', defenseBuff: '+15% DEF', points: 1200 },
    { id: 'node_3', name: '바람의 요새', occupiedBy: '발키리 연합', defenseBuff: '+10% SPD', points: 900 },
    { id: 'node_4', name: '용의 제단', occupiedBy: '중립 (공석)', defenseBuff: '보너스 2배', points: 2000 },
  ];

  const handleTriggerParty = () => {
    setShowChampagneFx(true);
    triggerHaptic('heavy');
    onBuyChampagnePack();
    setTimeout(() => setShowChampagneFx(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-amber-500/60 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="text-amber-400" size={20} />
            <h3 className="text-sm font-black text-white">주간 길드 4대 영지 쟁탈전</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-slate-900/60 gap-1 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('nodes')}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'nodes' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            영지 점령 상황
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('party')}
            className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'party' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PartyPopper size={14} />
            <span>샴페인 파티팩</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
          {activeTab === 'nodes' ? (
            <>
              <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                주말마다 4대 거점을 점령하여 길드 랭킹 포인트를 획득하세요. 점령 중인 거점은 길드원 전체에게 스탯 버프를 제공합니다!
              </div>

              <div className="flex flex-col gap-2.5">
                {territoryNodes.map(node => {
                  const isMine = node.occupiedBy === guildName;
                  return (
                    <div
                      key={node.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between ${
                        isMine
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Shield size={14} className={isMine ? 'text-amber-400' : 'text-slate-400'} />
                          <span className="text-xs font-black text-white">{node.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          점령: <span className={isMine ? 'text-emerald-400 font-bold' : 'text-slate-300'}>{node.occupiedBy}</span> | 효과: {node.defenseBuff}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('heavy');
                          onStartBattle(node.name);
                        }}
                        className={`px-3 py-1.5 text-xs font-black rounded-xl active:scale-95 ${
                          isMine
                            ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                            : 'bg-gradient-to-r from-rose-600 to-amber-600 text-white'
                        }`}
                      >
                        {isMine ? '수성 지원' : '공격 출진'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl">
                🍾
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-300">길드 챔피언 축하 샴페인 파티팩</h4>
                <p className="text-xs text-slate-400 mt-1">
                  승리 후 파티팩을 터트리면 길드 하우스 전체에 화려한 샴페인 분수가 쏟아지며, 접속 중인 모든 길드원에게 300 SNS와 길드 공헌도 500pt가 즉시 지급됩니다!
                </p>
              </div>

              {showChampagneFx && (
                <div className="p-3 bg-amber-500/20 border border-amber-400 rounded-xl text-xs font-black text-amber-300 animate-bounce">
                  ✨ 🍾 팡! 샴페인 분수가 터졌습니다! 길드원 전원에게 축하 보너스 지급 완료! ✨
                </div>
              )}

              <button
                type="button"
                onClick={handleTriggerParty}
                className="h-12 w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 cursor-pointer"
              >
                <PartyPopper size={18} />
                <span>샴페인 파티팩 구매 & 분수 발사 (1,500원 / 300 SNS)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
