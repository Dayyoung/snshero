import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Swords, Calendar, Eye, X, Shield, Award, Sparkles } from 'lucide-react';
import { Language, CardData } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { cn, getFormattedCardName } from '../lib/utils';

export interface MatchHistoryRecord {
  id?: string;
  timestamp: number | string;
  result: 'win' | 'loss' | 'draw' | 'VICTORY' | 'DEFEAT' | 'DRAW';
  myScore?: number;
  opponentScore?: number;
  opponentName?: string;
  snsEarned?: number;
  deckCardIds?: number[];
  mode?: string;
}

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [historyLogs, setHistoryLogs] = useState<MatchHistoryRecord[]>([]);
  const [selectedMatchDeck, setSelectedMatchDeck] = useState<{
    opponentName: string;
    result: string;
    cardIds: number[];
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('hero_match_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistoryLogs(parsed.slice(-20).reverse()); // Latest 20 matches
          return;
        }
      }
    } catch (e) {
      console.error("Failed to parse hero_match_history:", e);
    }

    // Default mock history if none exists yet
    setHistoryLogs([
      {
        timestamp: Date.now() - 1000 * 60 * 15,
        result: 'VICTORY',
        myScore: 3,
        opponentScore: 1,
        opponentName: 'AI Hero Bot #42',
        snsEarned: 150,
        deckCardIds: [1, 5, 12, 23, 40],
        mode: 'PVP Rank Match'
      },
      {
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        result: 'DEFEAT',
        myScore: 1,
        opponentScore: 3,
        opponentName: 'MasterRival_99',
        snsEarned: 30,
        deckCardIds: [2, 8, 15, 29, 33],
        mode: 'PVP Rank Match'
      },
      {
        timestamp: Date.now() - 1000 * 60 * 60 * 5,
        result: 'VICTORY',
        myScore: 3,
        opponentScore: 0,
        opponentName: 'ShadowBlade',
        snsEarned: 200,
        deckCardIds: [1, 7, 18, 22, 50],
        mode: 'PVP Rank Match'
      }
    ]);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Swords size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {language === 'ko' ? '최근 대전 기록 (Match History)' : 'Match History & Decks'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'ko' ? '최근 대전 결과 및 사용된 덱 구성을 확인합니다.' : 'Review recent battle logs and active decks.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* History List */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[250px]">
            {historyLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Trophy size={36} className="mx-auto opacity-30" />
                <p className="text-xs font-bold">
                  {language === 'ko' ? '아직 경기 기록이 없습니다.' : 'No match records found.'}
                </p>
              </div>
            ) : (
              historyLogs.map((item, idx) => {
                const isWin = String(item.result).toUpperCase() === 'WIN' || String(item.result).toUpperCase() === 'VICTORY';
                const isDraw = String(item.result).toUpperCase() === 'DRAW';
                const dateStr = typeof item.timestamp === 'number' 
                  ? new Date(item.timestamp).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : String(item.timestamp);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all",
                      isWin 
                        ? "bg-emerald-50/60 border-emerald-200" 
                        : isDraw 
                          ? "bg-amber-50/60 border-amber-200"
                          : "bg-rose-50/60 border-rose-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Win/Loss Badge */}
                      <div className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-black uppercase shrink-0 text-white shadow-xs",
                        isWin ? "bg-emerald-600" : isDraw ? "bg-amber-500" : "bg-rose-600"
                      )}>
                        {isWin ? (language === 'ko' ? '승리' : 'WIN') : isDraw ? (language === 'ko' ? '무승부' : 'DRAW') : (language === 'ko' ? '패배' : 'LOSS')}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-800">
                            vs {item.opponentName || 'Opponent Hero'}
                          </span>
                          {item.myScore !== undefined && (
                            <span className="text-xs font-extrabold px-1.5 py-0.5 rounded-md bg-white/80 border border-slate-200 text-slate-700">
                              {item.myScore} : {item.opponentScore}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {dateStr}
                          </span>
                          {item.snsEarned && (
                            <span className="text-amber-600 font-extrabold">
                              +{item.snsEarned} SNS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* View Deck Button */}
                    {item.deckCardIds && item.deckCardIds.length > 0 && (
                      <button
                        onClick={() => setSelectedMatchDeck({
                          opponentName: item.opponentName || 'Opponent',
                          result: isWin ? 'WIN' : 'LOSS',
                          cardIds: item.deckCardIds || []
                        })}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Eye size={13} className="text-indigo-600" />
                        <span>{language === 'ko' ? '사용 덱' : 'View Deck'}</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              {language === 'ko' ? '닫기' : 'Close'}
            </button>
          </div>
        </motion.div>

        {/* Sub-Modal: Deck Viewer */}
        <AnimatePresence>
          {selectedMatchDeck && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-950/80">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {language === 'ko' ? '경기 사용 덱 정보' : 'Match Deck Composition'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      vs {selectedMatchDeck.opponentName} ({selectedMatchDeck.result})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedMatchDeck(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2 py-2">
                  {selectedMatchDeck.cardIds.map((cId, idx) => {
                    const dbCard = CARD_DATABASE[cId];
                    if (!dbCard) return null;
                    const cardData: CardData = {
                      id: `match-deck-${cId}-${idx}`,
                      imageIndex: cId,
                      title_dis: dbCard.title_dis,
                      title: dbCard.title,
                      title_en: dbCard.title_en,
                      stats: dbCard.stats || [1,1,1,1],
                      rarity: dbCard.rarity || 'common',
                      level: 1,
                      owner: null
                    };

                    return (
                      <div key={idx} className="flex flex-col items-center gap-1 text-center">
                        <CardItem card={cardData} className="w-14 h-20 rounded-md shadow-xs" />
                        <span className="text-[9px] font-bold text-slate-700 truncate w-full">
                          {getFormattedCardName(cardData, language)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSelectedMatchDeck(null)}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all"
                >
                  {language === 'ko' ? '확인' : 'OK'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
