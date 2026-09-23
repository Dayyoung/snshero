import React, { useState, useEffect, useRef } from 'react';
import { Shield, Flame, Zap, Target, Search, Swords, Bot, Sparkles } from 'lucide-react';
import { CardData } from '../types';
import { CardItem } from './CardItem';

export interface BattleIntermissionProps {
  mode: 'ranking_search' | 'mission_dialogue';
  targetCard?: CardData | null;
  targetCardId?: number | null;
  opponentName?: string;
  lastResult?: 'win' | 'loss' | 'draw' | null;
  language?: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export const BattleIntermissionScreen: React.FC<BattleIntermissionProps> = ({
  mode,
  targetCard,
  targetCardId,
  opponentName = '상대 헌터',
  lastResult = null,
  language = 'ko',
  onComplete,
  onCancel,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            onCompleteRef.current();
          }, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, targetCardId]);

  // 미션 캐릭터 대사 생성
  const getMissionDialogue = () => {
    if (lastResult === 'win') {
      const winReactions = language === 'ko' ? [
        '크윽... 방심했다! 내 카드의 진짜 위력을 보여주마!',
        '아직 끝나지 않았다... 다음 판에서 반드시 꺾어주마!',
        '제법이군... 이번엔 전력으로 상대해주마!',
        '인정할 수 없다! 다시 한 번 진검승부다!'
      ] : [
        'Argh... I lowered my guard! Now witness my true power!',
        'It is not over yet... I will crush you next round!',
        'Impressive... but now I will fight with everything I have!',
        'I cannot accept this defeat! Let us clash once more!'
      ];
      return winReactions[(targetCardId || 1) % winReactions.length];
    } else if (lastResult === 'loss') {
      const lossReactions = language === 'ko' ? [
        '후후, 네 전략은 이미 다 읽었다! 어디 한번 덤벼봐라!',
        '아직 내 적수가 되지 못하는군. 다시 도전해 보아라!',
        '내 덱의 완성도는 완벽하다! 이번에도 이겨주마!',
        '더 수련하고 오도록 해라, 헌터여!'
      ] : [
        'Heh, I have read all your moves! Come at me again!',
        'You are not yet my equal. Try challenging me once more!',
        'My deck is flawless! Victory shall be mine again!',
        'Train harder, Hunter!'
      ];
      return lossReactions[(targetCardId || 1) % lossReactions.length];
    } else if (lastResult === 'draw') {
      return language === 'ko' 
        ? '호오, 호각의 승부였군. 다음 한 판으로 반드시 결판을 내자!'
        : 'A razor-thin draw! This next round will decide our fate!';
    } else {
      return language === 'ko'
        ? '내 도전을 받아들여라! 전설의 카드를 건 진정한 승부다!'
        : 'Accept my challenge! A battle of true destiny begins!';
    }
  };

  return (
    <div className="fixed inset-0 z-[220] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 font-mono select-none">
      {/* ─── 1. 랭킹대전: 3초 검색 모드 ───────────────────────────────── */}
      {mode === 'ranking_search' && (
        <div className="w-full max-w-sm bg-gradient-to-b from-stone-900 to-[#0c101d] border-2 border-cyan-500/60 rounded-sm p-5 flex flex-col items-center text-center shadow-[0_0_40px_rgba(6,182,212,0.3)]">
          {/* 상단 뱃지 */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-400 rounded-full text-cyan-300 text-xs font-black tracking-widest uppercase mb-4 animate-pulse">
            <Search size={14} className="animate-spin" />
            <span>{language === 'ko' ? '랭킹대전 상대 탐색 중' : 'MATCHMAKING SEARCH'}</span>
          </div>

          {/* 중앙 레이더 스캔 애니메이션 */}
          <div className="relative w-36 h-36 my-3 flex items-center justify-center">
            {/* 외곽 펄스 링 */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-60" />
            <div className="absolute inset-2 rounded-full border border-cyan-400/50" />
            <div className="absolute inset-6 rounded-full border border-cyan-300/40 border-dashed animate-spin duration-1000" />
            
            {/* 회전 레이더 빔 */}
            <div 
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: 'conic-gradient(from 0deg, rgba(6,182,212,0.4) 0deg, transparent 60deg, transparent 360deg)',
                animation: 'spin 1.5s linear infinite'
              }}
            />

            {/* 십자 가이드선 */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/30" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/30" />

            {/* 카운트다운 숫자 (3 -> 2 -> 1) */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-5xl font-black text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)] animate-scale">
                {countdown > 0 ? countdown : 'GO!'}
              </span>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-0.5">
                {countdown > 0 ? (language === 'ko' ? '초 후 시작' : 'SEC REMAINING') : (language === 'ko' ? '매칭 완료!' : 'MATCH READY')}
              </span>
            </div>
          </div>

          {/* 상대 정보 및 상태 텍스트 */}
          <div className="w-full my-3 p-2.5 bg-black/60 border border-cyan-500/30 rounded-xs flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between items-center text-stone-400">
              <span>{language === 'ko' ? '대상 모드' : 'Mode'}:</span>
              <span className="font-bold text-cyan-300">{language === 'ko' ? '실시간 랭킹전' : 'Ranked Match'}</span>
            </div>
            <div className="flex justify-between items-center text-stone-400">
              <span>{language === 'ko' ? '상대' : 'Opponent'}:</span>
              <span className="font-bold text-amber-300 truncate max-w-[140px]">{opponentName}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold justify-center mt-1 border-t border-white/5 pt-1">
              <Sparkles size={11} className="animate-spin" />
              <span>
                {countdown === 3 
                  ? (language === 'ko' ? '최적 레이팅 헌터 검색 중...' : 'Searching hunter rating...')
                  : countdown === 2
                  ? (language === 'ko' ? '상대 덱 및 전투력 동기화 완료...' : 'Syncing opponent deck...')
                  : (language === 'ko' ? '매칭 확정! 카드 배틀을 시작합니다.' : 'Match confirmed! Battle starting.')}
              </span>
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-cyan-500/40">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${((4 - countdown) / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ─── 2. 미션 게임: 3초 대사 모드 ───────────────────────────────── */}
      {mode === 'mission_dialogue' && (
        <div className="w-full max-w-sm bg-gradient-to-b from-stone-900 via-[#18111e] to-[#0d0a14] border-2 border-amber-500/60 rounded-sm p-5 flex flex-col items-center text-center shadow-[0_0_40px_rgba(245,158,11,0.25)]">
          {/* 상단 뱃지 */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 border border-amber-400 rounded-full text-amber-300 text-xs font-black tracking-widest uppercase mb-3">
            <Target size={14} className="text-amber-400" />
            <span>
              {language === 'ko' 
                ? `미션 결투 No.${targetCardId ?? '?'}` 
                : `MISSION DUEL No.${targetCardId ?? '?'}`}
            </span>
          </div>

          {/* 캐릭터 일러스트 / 아바타 프리뷰 */}
          <div className="relative my-2">
            {targetCard ? (
              <div className="w-[84px] aspect-[5/7] rounded-xs border-2 border-amber-400 shadow-xl shadow-amber-500/30 overflow-hidden">
                <CardItem
                  card={targetCard}
                  isLocked={true}
                  language={language}
                  className="w-full h-full pointer-events-none rounded-xs"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg">
                <Swords size={32} />
              </div>
            )}
            
            {/* 카운트다운 뱃지 */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center border-2 border-stone-950 shadow-md animate-bounce">
              {countdown > 0 ? countdown : '!'}
            </div>
          </div>

          {/* 캐릭터 이름 */}
          <div className="text-sm font-black text-amber-300 mt-1 uppercase tracking-wider">
            {opponentName}
          </div>

          {/* 3초 대사 말풍선 */}
          <div className="relative w-full my-3 p-3 bg-stone-950/90 border border-amber-400/50 rounded-xs shadow-inner text-left">
            <div className="text-[10px] text-amber-400 font-bold mb-1 flex items-center gap-1">
              <Flame size={12} className="text-amber-500" />
              <span>{language === 'ko' ? '결의의 한마디' : 'Mission Battle Cry'}</span>
            </div>
            <p className="text-xs font-bold text-stone-100 leading-relaxed italic">
              "{getMissionDialogue()}"
            </p>
          </div>

          {/* 3초 카운트다운 안내 */}
          <div className="text-[11px] font-black text-amber-300 mb-2 flex items-center gap-1">
            <Sparkles size={13} className="animate-spin text-amber-400" />
            <span>
              {language === 'ko' 
                ? `⏱️ [ ${countdown}초 ] 후 배틀 개시!` 
                : `⏱️ Battle starts in [ ${countdown}s ]!`}
            </span>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-amber-500/40">
            <div 
              className="bg-gradient-to-r from-amber-500 to-rose-400 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${((4 - countdown) / 3) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
