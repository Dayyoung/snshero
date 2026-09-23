/**
 * FlashAuctionModal.tsx - SCR-05-27
 * 30분 카운트다운 제한시간 동안 실시간 호가 경쟁이 붙는 '플래시 블라인드/오픈 경매장(Flash Auction)' 시스템 도입 및
 * 낙찰 시 축하 팡파르 연출 + 출품자/구매자 양측에 마켓 마일리지 리워드 지급.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gavel, Clock, Trophy, Sparkles, TrendingUp, X, Check, ArrowUpRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

interface FlashAuctionItem {
  id: string;
  cardName: string;
  cardGrade: string;
  cardImage?: string;
  sellerName: string;
  currentBid: number;
  highestBidder: string;
  buyoutPrice: number;
  endTime: number; // timestamp
}

interface FlashAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionItem: FlashAuctionItem;
  userSns: number;
  onPlaceBid: (newBid: number) => void;
  onInstantBuyout: () => void;
}

export const FlashAuctionModal: React.FC<FlashAuctionModalProps> = ({
  isOpen,
  onClose,
  auctionItem,
  userSns,
  onPlaceBid,
  onInstantBuyout,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(1800); // 30m
  const [currentBid, setCurrentBid] = useState(auctionItem.currentBid);
  const [highestBidder, setHighestBidder] = useState(auctionItem.highestBidder);
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentBid(auctionItem.currentBid);
    setHighestBidder(auctionItem.highestBidder);
    setIsWon(false);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, auctionItem]);

  if (!isOpen) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleBidIncrement = (increment: number) => {
    const nextBid = currentBid + increment;
    if (userSns < nextBid) {
      triggerHaptic('heavy');
      return;
    }

    triggerHaptic('medium');
    setCurrentBid(nextBid);
    setHighestBidder('나 (최고 입찰자)');
    onPlaceBid(nextBid);
  };

  const handleBuyout = () => {
    if (userSns < auctionItem.buyoutPrice) {
      triggerHaptic('heavy');
      return;
    }

    triggerHaptic('heavy');
    setIsWon(true);
    onInstantBuyout();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none overflow-hidden">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-center"
      >
        {/* Header */}
        <div className="p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 flex items-center justify-between font-black text-xs">
          <div className="flex items-center gap-1.5">
            <Gavel size={16} />
            <span>[ 플래시 블라인드/오픈 경매장 ]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-black/20 flex items-center justify-center text-slate-950 active:scale-95 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          {/* Timer & Status */}
          <div className="w-full flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1 text-rose-400 font-bold bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-500/30">
              <Clock size={13} className="animate-pulse" />
              <span>제한시간 {timeStr}</span>
            </div>
            <span className="text-slate-400 text-[11px]">
              출품자: <strong className="text-slate-200">{auctionItem.sellerName}</strong>
            </span>
          </div>

          {/* Item Card Preview */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 text-left">
            <div className="w-16 h-20 bg-slate-800 rounded-xl border-2 border-amber-400/60 flex items-center justify-center text-3xl shadow">
              {auctionItem.cardImage ? (
                <img
                  src={auctionItem.cardImage}
                  alt={auctionItem.cardName}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                '🃏'
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px]">
                  {auctionItem.cardGrade}
                </span>
                <span className="text-xs font-black text-white">{auctionItem.cardName}</span>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-slate-400 text-[10px] block">현재 최고 입찰가</span>
                <span className="text-amber-400 font-black text-base">{currentBid} SNS</span>
              </div>
              <span className="text-[10px] text-cyan-400 block font-bold">
                입찰자: {highestBidder}
              </span>
            </div>
          </div>

          {/* Winning Fanfare Display */}
          {isWon ? (
            <div className="w-full p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-center space-y-1">
              <div className="text-sm font-black text-emerald-400 flex items-center justify-center gap-1.5">
                <Trophy size={16} />
                <span>🎉 즉시 낙찰 성공!</span>
              </div>
              <p className="text-[10px] text-slate-300">
                카드가 인벤토리로 지급되었으며 마켓 마일리지 +50P가 적립되었습니다.
              </p>
            </div>
          ) : (
            <>
              {/* Bidding Buttons */}
              <div className="w-full grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleBidIncrement(50)}
                  className="h-11 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow"
                >
                  <TrendingUp size={14} />
                  <span>+50 SNS 입찰</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBidIncrement(100)}
                  className="h-11 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-black text-xs rounded-xl flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow"
                >
                  <TrendingUp size={14} />
                  <span>+100 SNS 입찰</span>
                </button>
              </div>

              {/* Instant Buyout Button (48px) */}
              <button
                type="button"
                onClick={handleBuyout}
                className="h-12 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-lg"
              >
                <Sparkles size={16} />
                <span>즉시 구매 낙찰 ({auctionItem.buyoutPrice} SNS)</span>
              </button>
            </>
          )}

          {/* Reward note */}
          <div className="w-full p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-[10px] text-slate-400 text-left flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400 shrink-0" />
            <span>낙찰 시 출품자/낙찰자 모두에게 마켓 마일리지 50P가 자동 증정됩니다.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
