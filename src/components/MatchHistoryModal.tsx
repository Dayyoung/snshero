import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Swords, Calendar, Eye, X, Shield, Award, Sparkles,
  ChevronDown, ChevronUp, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Zap, User
} from 'lucide-react';
import { Language, CardData } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from './CardItem';
import { cn, getFormattedCardName } from '../lib/utils';

export interface CardDetailInfo {
  id?: string | number;
  imageIndex?: number;
  title?: string;
  title_dis?: string;
  title_en?: string;
  stats?: number[]; // [Up, Right, Down, Left]
  level?: number;
  power?: number;
  rarity?: string;
}

export interface MatchHistoryRecord {
  id?: string;
  timestamp: number | string;
  result: 'win' | 'loss' | 'draw' | 'VICTORY' | 'DEFEAT' | 'DRAW';
  myScore?: number;
  opponentScore?: number;
  opponentName?: string;
  snsEarned?: number;
  deckCardIds?: number[];
  opponentCardIds?: number[];
  myCards?: CardDetailInfo[];
  opponentCards?: CardDetailInfo[];
  mode?: string;
  myTotalPower?: number;
  opponentTotalPower?: number;
}

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

function parse4Stats(rawStats?: number[]): [number, number, number, number] {
  if (rawStats && rawStats.length >= 4) {
    return [rawStats[0], rawStats[1], rawStats[2], rawStats[3]];
  }
  return [1, 1, 1, 1];
}

function toCardData(item: CardDetailInfo | number, defaultIdx: number): CardData {
  if (typeof item === 'number') {
    const dbCard = CARD_DATABASE[item] || CARD_DATABASE[1];
    return {
      id: `hist_card_${item}_${Math.random().toString(36).substring(2, 6)}`,
      imageIndex: item,
      title: dbCard.title,
      title_dis: dbCard.title_dis,
      title_en: dbCard.title_en,
      stats: parse4Stats(dbCard.stats),
      rarity: (dbCard.rarity as any) || 'common',
      level: 1,
      owner: null
    };
  }

  const cId = item.imageIndex || (typeof item.id === 'number' ? item.id : defaultIdx);
  const dbCard = CARD_DATABASE[cId] || CARD_DATABASE[1];

  return {
    id: `hist_card_${cId}_${Math.random().toString(36).substring(2, 6)}`,
    imageIndex: cId,
    title: item.title || dbCard.title,
    title_dis: item.title_dis || dbCard.title_dis,
    title_en: item.title_en || dbCard.title_en,
    stats: parse4Stats(item.stats || dbCard.stats),
    rarity: (item.rarity as any) || dbCard.rarity || 'common',
    level: item.level || 1,
    owner: null
  };
}

function resolveMatchDecks(record: MatchHistoryRecord) {
  // 1. My Deck Cards
  let myCardsList: CardData[] = [];
  if (record.myCards && record.myCards.length > 0) {
    myCardsList = record.myCards.map((c, i) => toCardData(c, i + 1));
  } else if (record.deckCardIds && record.deckCardIds.length > 0) {
    myCardsList = record.deckCardIds.map((id, i) => toCardData(id, i + 1));
  } else {
    myCardsList = [1, 5, 12, 23, 40].map((id, i) => toCardData(id, i + 1));
  }

  // 2. Opponent Deck Cards
  let oppCardsList: CardData[] = [];
  if (record.opponentCards && record.opponentCards.length > 0) {
    oppCardsList = record.opponentCards.map((c, i) => toCardData(c, i + 2));
  } else if (record.opponentCardIds && record.opponentCardIds.length > 0) {
    oppCardsList = record.opponentCardIds.map((id, i) => toCardData(id, i + 2));
  } else {
    const seed = record.deckCardIds?.[0] || 3;
    const defaultOpponentIds = [
      ((seed + 2) % 100) + 1,
      ((seed + 7) % 100) + 1,
      ((seed + 14) % 100) + 1,
      ((seed + 26) % 100) + 1,
      ((seed + 35) % 100) + 1,
    ];
    oppCardsList = defaultOpponentIds.map((id, i) => toCardData(id, i + 2));
  }

  const myPower = myCardsList.reduce((sum, c) => sum + (c.stats?.reduce((a, b) => a + b, 0) || 0), 0);
  const oppPower = oppCardsList.reduce((sum, c) => sum + (c.stats?.reduce((a, b) => a + b, 0) || 0), 0);

  return { myCardsList, oppCardsList, myPower, oppPower };
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isKo = language === 'ko';
  const [historyLogs, setHistoryLogs] = useState<MatchHistoryRecord[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [focusedCard, setFocusedCard] = useState<CardData | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('hero_match_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoryLogs(parsed.slice(-30).reverse()); // Latest 30 matches
          return;
        }
      }
    } catch (e) {
      console.error("Failed to parse hero_match_history:", e);
    }

    // Default mock history if none exists
    setHistoryLogs([
      {
        id: 'mock_match_1',
        timestamp: Date.now() - 1000 * 60 * 15,
        result: 'VICTORY',
        myScore: 3,
        opponentScore: 1,
        opponentName: 'AI Hero Bot #42',
        snsEarned: 150,
        deckCardIds: [1, 5, 12, 23, 40],
        opponentCardIds: [3, 8, 15, 27, 44],
        mode: 'PVP Rank Match'
      },
      {
        id: 'mock_match_2',
        timestamp: Date.now() - 1000 * 60 * 60 * 2,
        result: 'DEFEAT',
        myScore: 1,
        opponentScore: 3,
        opponentName: 'MasterRival_99',
        snsEarned: 30,
        deckCardIds: [2, 8, 15, 29, 33],
        opponentCardIds: [1, 7, 18, 22, 50],
        mode: 'PVP Rank Match'
      },
      {
        id: 'mock_match_3',
        timestamp: Date.now() - 1000 * 60 * 60 * 5,
        result: 'VICTORY',
        myScore: 3,
        opponentScore: 0,
        opponentName: 'ShadowBlade',
        snsEarned: 200,
        deckCardIds: [1, 7, 18, 22, 50],
        opponentCardIds: [4, 9, 16, 31, 48],
        mode: 'PVP Rank Match'
      }
    ]);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md font-mono">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-slate-950 text-slate-100 rounded-3xl max-w-2xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                <Swords size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>{isKo ? '대전 기록 및 상세 분석' : 'Battle History & Card Analysis'}</span>
                  <span className="text-[10px] bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                    {historyLogs.length} LOGS
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-sans">
                  {isKo ? '매치를 클릭하여 양측의 사용 카드 및 전투 수치를 비교할 수 있습니다.' : 'Click any match to expand detailed card decks & battle stats.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* History List */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 min-h-[300px]">
            {historyLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2 font-sans">
                <Trophy size={40} className="mx-auto opacity-30 text-amber-500" />
                <p className="text-xs font-bold">
                  {isKo ? '아직 기록된 대전 내역이 없습니다.' : 'No battle history logs recorded yet.'}
                </p>
              </div>
            ) : (
              historyLogs.map((item, idx) => {
                const isWin = String(item.result).toUpperCase() === 'WIN' || String(item.result).toUpperCase() === 'VICTORY';
                const isDraw = String(item.result).toUpperCase() === 'DRAW';
                const isExpanded = expandedIndex === idx;

                const dateStr = typeof item.timestamp === 'number'
                  ? new Date(item.timestamp).toLocaleString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : String(item.timestamp);

                const { myCardsList, oppCardsList, myPower, oppPower } = resolveMatchDecks(item);

                return (
                  <div
                    key={item.id || idx}
                    className={cn(
                      "rounded-2xl border transition-all duration-200 overflow-hidden",
                      isWin
                        ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/60"
                        : isDraw
                          ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/60"
                          : "bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60",
                      isExpanded && "ring-1 ring-indigo-500/50 shadow-lg"
                    )}
                  >
                    {/* Expandable Click Row */}
                    <div
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Win / Loss Outcome Badge */}
                        <div className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-black uppercase shrink-0 text-white shadow-sm flex items-center gap-1",
                          isWin ? "bg-emerald-600" : isDraw ? "bg-amber-500" : "bg-rose-600"
                        )}>
                          <Trophy size={12} className="shrink-0" />
                          <span>{isWin ? (isKo ? '승리' : 'WIN') : isDraw ? (isKo ? '무승부' : 'DRAW') : (isKo ? '패배' : 'LOSS')}</span>
                        </div>

                        {/* Match Basic Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-100 truncate">
                              vs {item.opponentName || 'Opponent Hero'}
                            </span>
                            {item.myScore !== undefined && (
                              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-amber-400">
                                {item.myScore} : {item.opponentScore}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">
                              {item.mode || 'Ranked Match'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={10} className="text-slate-500" />
                              {dateStr}
                            </span>
                            {item.snsEarned !== undefined && (
                              <span className={cn(
                                "font-extrabold",
                                item.snsEarned >= 0 ? "text-amber-400" : "text-rose-400"
                              )}>
                                {item.snsEarned >= 0 ? `+${item.snsEarned}` : item.snsEarned} SNS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand / Collapse Action Badge */}
                      <button
                        type="button"
                        className={cn(
                          "px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer",
                          isExpanded
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                        )}
                      >
                        <Eye size={13} className="text-indigo-400" />
                        <span className="text-[11px] font-extrabold">
                          {isExpanded ? (isKo ? '접기' : 'Hide') : (isKo ? '덱 상세' : 'Expand Deck')}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* Expandable Match Detail View */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="border-t border-slate-800/80 bg-slate-950/90 p-3.5 space-y-4"
                        >
                          {/* Power Comparison Banner */}
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Zap size={15} className="text-amber-400 animate-pulse" />
                              <span className="font-black text-slate-200 uppercase">
                                {isKo ? '총 파워 비교 (Total Power)' : 'Total Power Comparison'}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                              <div className="text-right">
                                <span className="text-[10px] text-indigo-400 font-bold block">{isKo ? '내 덱 총 파워' : 'My Deck Power'}</span>
                                <span className="text-base font-black text-indigo-300">{myPower}</span>
                              </div>

                              <span className="text-slate-600 font-black text-sm">VS</span>

                              <div className="text-left">
                                <span className="text-[10px] text-rose-400 font-bold block">{isKo ? '상대 덱 총 파워' : 'Opponent Power'}</span>
                                <span className="text-base font-black text-rose-300">{oppPower}</span>
                              </div>
                            </div>
                          </div>

                          {/* 2-Column Deck & Card Stats Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* Player 1 Deck (My Deck) */}
                            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-3 space-y-2.5">
                              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300">
                                  <User size={14} className="text-indigo-400" />
                                  <span>{isKo ? '내 카드 덱 (My Deck)' : 'My Active Cards'}</span>
                                </div>
                                <span className="text-[10px] font-extrabold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
                                  {myCardsList.length} CARDS
                                </span>
                              </div>

                              <div className="space-y-2">
                                {myCardsList.map((card, cIdx) => {
                                  const cardStats = card.stats || [1, 1, 1, 1];
                                  const cardTotal = cardStats.reduce((a, b) => a + b, 0);

                                  return (
                                    <div
                                      key={`my-${cIdx}`}
                                      onClick={() => setFocusedCard(card)}
                                      className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-lg p-2 flex items-center justify-between gap-2 transition-all cursor-pointer hover:bg-indigo-950/30"
                                    >
                                      {/* Card Mini Preview */}
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <CardItem card={card} className="w-10 h-14 rounded shadow-xs shrink-0" hideStats />
                                        <div className="min-w-0">
                                          <div className="text-xs font-black text-slate-100 truncate">
                                            {getFormattedCardName(card, language)}
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[9px] font-extrabold text-amber-400 uppercase bg-amber-950/80 px-1 rounded border border-amber-500/30">
                                              {card.rarity || 'COMMON'}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                              Lv.{card.level || 1}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Directional Stats Grid */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-extrabold bg-slate-950 p-1.5 rounded border border-slate-800 text-slate-300">
                                          <span className="text-indigo-400 flex items-center gap-0.5">↑ {cardStats[0]}</span>
                                          <span className="text-indigo-400 flex items-center gap-0.5">→ {cardStats[1]}</span>
                                          <span className="text-indigo-400 flex items-center gap-0.5">↓ {cardStats[2]}</span>
                                          <span className="text-indigo-400 flex items-center gap-0.5">← {cardStats[3]}</span>
                                        </div>
                                        <div className="text-right font-black text-xs text-amber-400 min-w-[32px]">
                                          {cardTotal}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Player 2 Deck (Opponent Deck) */}
                            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 space-y-2.5">
                              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                                <div className="flex items-center gap-1.5 text-xs font-black text-rose-300">
                                  <Shield size={14} className="text-rose-400" />
                                  <span>{isKo ? `상대 카드 덱 (vs ${item.opponentName || '상대'})` : `Opponent Deck`}</span>
                                </div>
                                <span className="text-[10px] font-extrabold bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40">
                                  {oppCardsList.length} CARDS
                                </span>
                              </div>

                              <div className="space-y-2">
                                {oppCardsList.map((card, cIdx) => {
                                  const cardStats = card.stats || [1, 1, 1, 1];
                                  const cardTotal = cardStats.reduce((a, b) => a + b, 0);

                                  return (
                                    <div
                                      key={`opp-${cIdx}`}
                                      onClick={() => setFocusedCard(card)}
                                      className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/60 rounded-lg p-2 flex items-center justify-between gap-2 transition-all cursor-pointer hover:bg-rose-950/30"
                                    >
                                      {/* Card Mini Preview */}
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <CardItem card={card} className="w-10 h-14 rounded shadow-xs shrink-0" hideStats />
                                        <div className="min-w-0">
                                          <div className="text-xs font-black text-slate-100 truncate">
                                            {getFormattedCardName(card, language)}
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[9px] font-extrabold text-amber-400 uppercase bg-amber-950/80 px-1 rounded border border-amber-500/30">
                                              {card.rarity || 'COMMON'}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400">
                                              Lv.{card.level || 1}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Directional Stats Grid */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-extrabold bg-slate-950 p-1.5 rounded border border-slate-800 text-slate-300">
                                          <span className="text-rose-400 flex items-center gap-0.5">↑ {cardStats[0]}</span>
                                          <span className="text-rose-400 flex items-center gap-0.5">→ {cardStats[1]}</span>
                                          <span className="text-rose-400 flex items-center gap-0.5">↓ {cardStats[2]}</span>
                                          <span className="text-rose-400 flex items-center gap-0.5">← {cardStats[3]}</span>
                                        </div>
                                        <div className="text-right font-black text-xs text-amber-400 min-w-[32px]">
                                          {cardTotal}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-sans">
              {isKo ? '목록의 각 경기를 클릭하여 확장/축소할 수 있습니다.' : 'Click any match entry to expand/collapse card details.'}
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all cursor-pointer shadow-md"
            >
              {isKo ? '닫기' : 'Close'}
            </button>
          </div>
        </motion.div>

        {/* Card Detail Popup Modal when a card is clicked */}
        <AnimatePresence>
          {focusedCard && (
            <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm font-mono">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 space-y-4 text-center shadow-2xl relative"
              >
                <button
                  onClick={() => setFocusedCard(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>

                <h3 className="text-sm font-black text-indigo-300 uppercase tracking-wider">
                  {isKo ? '카드 수치 및 스탯 정보' : 'Card Battle Stats'}
                </h3>

                <div className="flex justify-center py-2">
                  <CardItem card={focusedCard} className="w-28 h-40 rounded-xl shadow-lg" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black text-white">
                    {getFormattedCardName(focusedCard, language)}
                  </h4>
                  <div className="flex justify-center items-center gap-2 text-xs">
                    <span className="text-amber-400 font-extrabold uppercase">{focusedCard.rarity}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-bold">Lv.{focusedCard.level || 1}</span>
                  </div>
                </div>

                {/* Stat Grid */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isKo ? '4방향 전투 수치 (Up/Right/Down/Left)' : '4-Directional Combat Stats'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-black">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-indigo-400 flex items-center justify-between">
                      <span>↑ UP</span>
                      <span>{focusedCard.stats?.[0] || 0}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-indigo-400 flex items-center justify-between">
                      <span>→ RIGHT</span>
                      <span>{focusedCard.stats?.[1] || 0}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-indigo-400 flex items-center justify-between">
                      <span>↓ DOWN</span>
                      <span>{focusedCard.stats?.[2] || 0}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-indigo-400 flex items-center justify-between">
                      <span>← LEFT</span>
                      <span>{focusedCard.stats?.[3] || 0}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setFocusedCard(null)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  {isKo ? '확인' : 'OK'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
