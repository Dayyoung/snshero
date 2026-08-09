import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ScrollText, Swords, X, XCircle, ChevronLeft, ArrowRight, Zap, Cpu, Flame, Target as TargetIcon, RotateCcw, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { t } from '../../lib/i18n';
import type { CardData, Language } from '../../types';
import { CardItem } from '../CardItem';
import type { KadanRpgEncounter } from '../../content/kadanRpgStory';
import {
  buildOpponentRpgHand,
  buildPlayerRpgHand,
  chooseKadanAutoMove,
  countBattleScore,
  createInitialKadanBattleState,
  getCardDisplayName,
  placeKadanBattleCard,
  type KadanBattleResult,
} from '../../lib/kadanRpgBattle';

interface KadanBattleGateProps {
  encounter: KadanRpgEncounter;
  currentDeck: Array<CardData | null>;
  language: Language;
  autoBattle: boolean;
  onToggleAutoBattle?: () => void;
  lowSpecMode: boolean;
  rebirthLevel: number;
  onComplete: (result: KadanBattleResult) => void;
  onClose: () => void;
}

export const KadanBattleGate: React.FC<KadanBattleGateProps> = ({
  encounter,
  currentDeck,
  language,
  autoBattle,
  onToggleAutoBattle,
  lowSpecMode,
  rebirthLevel,
  onComplete,
  onClose,
}) => {
  const playerHand = useMemo(() => buildPlayerRpgHand(currentDeck), [currentDeck]);
  const aiHand = useMemo(
    () => buildOpponentRpgHand(encounter.opponentCardIds, encounter.difficulty, rebirthLevel),
    [encounter, rebirthLevel],
  );
  const [state, setState] = useState(() => createInitialKadanBattleState(playerHand, aiHand));
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [hasReported, setHasReported] = useState(false);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [skillCooldowns, setSkillCooldowns] = useState<{ [key: number]: number }>({});
  const [activeSkillEffect, setActiveSkillEffect] = useState<{
    id: number;
    titleKo: string;
    titleEn: string;
    color: string;
    icon: any;
  } | null>(null);
  const score = countBattleScore(state.board);

  useEffect(() => {
    const timer = setInterval(() => {
      setSkillCooldowns(prev => {
        const next = { ...prev };
        let hasChange = false;
        Object.keys(next).forEach(key => {
          const k = Number(key);
          if (next[k] > 0) {
            next[k] -= 1;
            hasChange = true;
          }
        });
        return hasChange ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExecuteSkill = (skillId: number) => {
    const cd = skillCooldowns[skillId] || 0;
    if (cd > 0 || state.result || activeSkillEffect) return;

    playSfx('https://assets.mixkit.co/active_storage/sfx/1190/1190-preview.mp3');
    setSkillCooldowns(prev => ({ ...prev, [skillId]: 5 }));

    if (skillId === 1) {
      setActiveSkillEffect({
        id: 1,
        titleKo: '강화 함성',
        titleEn: 'Rallying Roar',
        color: 'red',
        icon: Flame,
      });
      setState(prev => ({
        ...prev,
        board: prev.board.map(card => {
          if (card && card.owner === 'player') {
            return {
              ...card,
              stats: card.stats.map(s => Math.min(9, s + 1)) as [number, number, number, number]
            };
          }
          return card;
        }),
        log: [`[스킬] Kadan이 '강화 함성'을 사용하여 필드의 내 카드 파워를 강화했습니다!`, ...prev.log]
      }));
    } else if (skillId === 5) {
      setActiveSkillEffect({
        id: 5,
        titleKo: '약화 함정',
        titleEn: 'Weaken Trap',
        color: 'purple',
        icon: TargetIcon,
      });
      setState(prev => ({
        ...prev,
        board: prev.board.map(card => {
          if (card && card.owner === 'ai') {
            return {
              ...card,
              stats: card.stats.map(s => Math.max(0, s - 1)) as [number, number, number, number]
            };
          }
          return card;
        }),
        log: [`[스킬] Kadan이 '약화 함정'을 사용하여 필드의 상대 카드 파워를 약화시켰습니다!`, ...prev.log]
      }));
    } else if (skillId === 8) {
      setActiveSkillEffect({
        id: 8,
        titleKo: '체인지 내카드',
        titleEn: 'Swap Self',
        color: 'green',
        icon: RotateCcw,
      });
      setState(prev => ({
        ...prev,
        playerHand: prev.playerHand.map(card => ({
          ...card,
          stats: card.stats.map(s => Math.min(9, s + 1)) as [number, number, number, number]
        })),
        log: [`[스킬] Kadan이 '체인지 내카드'를 사용하여 손에 든 카드들의 성능을 강화했습니다!`, ...prev.log]
      }));
    }

    setTimeout(() => {
      setActiveSkillEffect(null);
    }, 1500);
  };

  const encounterIdRef = React.useRef(encounter.id);
  useEffect(() => {
    if (encounterIdRef.current !== encounter.id) {
      encounterIdRef.current = encounter.id;
      setState(createInitialKadanBattleState(playerHand, aiHand));
      setSelectedCardIndex(0);
      setHasReported(false);
      setShowBattleLog(false);
    }
  }, [encounter.id, playerHand, aiHand]);

  useEffect(() => {
    if (state.result || state.turn !== 'ai') return;
    const timer = window.setTimeout(() => {
      const move = chooseKadanAutoMove(state, 'ai', encounter.difficulty);
      if (move) {
        setState((previous) => placeKadanBattleCard(previous, 'ai', move.cardIndex, move.boardIndex, language));
      }
    }, lowSpecMode ? 350 : 500);
    return () => window.clearTimeout(timer);
  }, [encounter.difficulty, language, lowSpecMode, state]);

  useEffect(() => {
    if (!autoBattle || state.result || state.turn !== 'player') return;
    const timer = window.setTimeout(() => {
      const move = chooseKadanAutoMove(state, 'player', encounter.difficulty);
      if (move) {
        setState((previous) => placeKadanBattleCard(previous, 'player', move.cardIndex, move.boardIndex, language));
      }
    }, lowSpecMode ? 400 : 600);
    return () => window.clearTimeout(timer);
  }, [autoBattle, encounter.difficulty, language, lowSpecMode, state]);

  useEffect(() => {
    if (!autoBattle || !state.result || hasReported) return;
    const result = state.result;
    const timer = window.setTimeout(() => {
      setHasReported(true);
      onComplete(result);
    }, lowSpecMode ? 1000 : 1500);
    return () => window.clearTimeout(timer);
  }, [autoBattle, hasReported, lowSpecMode, onComplete, state.result]);

  const placePlayerCard = (boardIndex: number) => {
    if (autoBattle || state.turn !== 'player' || state.result) return;
    setState((previous) => placeKadanBattleCard(previous, 'player', selectedCardIndex, boardIndex, language));
    setSelectedCardIndex(0);
  };

  const audioCache = React.useRef<Map<string, HTMLAudioElement>>(new Map());
  const playSfx = (url: string) => {
    try {
      let audio = audioCache.current.get(url);
      if (!audio) {
        audio = new Audio(url);
        audio.volume = 0.5;
        audioCache.current.set(url, audio);
      } else {
        audio.currentTime = 0;
      }
      audio.play().catch(() => {});
    } catch (e) {
      // ignore
    }
  };

  const resultIcon = state.result === 'win'
    ? <CheckCircle2 size={18} className="text-emerald-500" />
    : state.result === 'loss'
      ? <XCircle size={18} className="text-rose-500" />
      : <Swords size={18} className="text-slate-500" />;

  const latestLog = state.log[0] || t('kadan_rpg_battle_ready', language);
  const moveOwner = state.lastMove?.side === 'player'
    ? 'Kadan'
    : (language === 'ko' ? '상대' : 'Echo');
  const moveSummary = state.lastMove
    ? language === 'ko'
      ? `${moveOwner}이 ${getCardDisplayName(state.lastMove.card, language)} 카드를 ${state.lastMove.boardIndex + 1}번 칸에 배치했습니다. ${state.lastMove.flippedIndices.length > 0 ? `${state.lastMove.flippedIndices.map((index) => index + 1).join(', ')}번 칸이 뒤집혔습니다.` : '뒤집힌 카드는 없습니다.'}`
      : `${moveOwner} placed ${getCardDisplayName(state.lastMove.card, language)} on slot ${state.lastMove.boardIndex + 1}. ${state.lastMove.flippedIndices.length > 0 ? `Slots ${state.lastMove.flippedIndices.map((index) => index + 1).join(', ')} flipped.` : 'No cards flipped.'}`
    : t('kadan_rpg_battle_ready', language);
  const resultSummary = state.result
    ? language === 'ko'
      ? `최종 점수 카단 ${score.player} : 상대 ${score.ai}. ${score.player > score.ai ? '카단의 카드가 더 많이 남아 승리했습니다.' : score.player < score.ai ? '상대 카드가 더 많이 남아 패배했습니다.' : '남은 카드 수가 같아 무승부입니다.'}`
      : `Final score Kadan ${score.player} : Echo ${score.ai}. ${score.player > score.ai ? 'Kadan wins with more cards on the board.' : score.player < score.ai ? 'Echo wins with more cards on the board.' : 'The board is tied, so this is a draw.'}`
    : moveSummary;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/95 p-1 sm:p-3 md:p-6 overflow-hidden text-slate-100 select-none">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative flex flex-col justify-between w-full h-full max-w-5xl rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#090d16]/95 text-white shadow-2xl p-2 sm:p-3 md:p-4 z-10 overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-2 md:pb-3">
          <div className="flex items-center gap-3">
            {/* 뒤로가기 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer text-xs font-bold"
              title="뒤로가기"
            >
              <ChevronLeft size={16} />
              <span>{language === 'ko' ? '뒤로' : 'Back'}</span>
            </button>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">{t('kadan_rpg_card_battle', language)}</p>
              <h3 className="text-sm font-black text-white md:text-base">{t(encounter.opponentNameKey, language)}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!state.result && (
              <div className={cn(
                "relative inline-flex items-center justify-center overflow-hidden rounded-xl transition-all",
                autoBattle ? "p-[2px] shadow-[0_0_12px_rgba(59,130,246,0.6)]" : ""
              )}>
                {autoBattle && (
                  <div className="absolute -inset-[180%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_180deg,#1d4ed8_270deg,#60a5fa_330deg,#93c5fd_360deg)]" />
                )}
                <button
                  type="button"
                  onClick={onToggleAutoBattle}
                  className={cn(
                    "relative z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-xs font-black transition-all active:scale-95 cursor-pointer",
                    autoBattle
                      ? "bg-slate-950 text-blue-400"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                  )}
                  title={language === 'ko' ? '자동 전투 온/오프' : 'Toggle Auto Battle'}
                >
                  <Bot size={14} className={cn(autoBattle && "animate-pulse text-blue-400")} />
                  <span>{autoBattle ? (language === 'ko' ? '자동전투 ON' : 'AUTO ON') : (language === 'ko' ? '자동전투 OFF' : 'AUTO OFF')}</span>
                </button>
              </div>
            )}

            {!state.result && (
              <button
                type="button"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    result: 'win',
                    log: [language === 'ko' ? '[스토리 모드] 즉시 승리로 전투를 돌파했습니다!' : '[Story Mode] Quick Victory activated!', ...prev.log],
                  }));
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:text-amber-200 transition-all text-xs font-black cursor-pointer active:scale-95"
                title={language === 'ko' ? '스토리 감상을 위해 즉시 승리' : 'Quick Win for Story Mode'}
              >
                <Zap size={14} className="text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline">{language === 'ko' ? '즉시 승리' : 'Quick Win'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-black text-white">
              {state.result ? resultIcon : <Swords size={14} className="text-indigo-500 animate-pulse" />}
              {state.result
                ? t(`kadan_rpg_battle_${state.result}`, language)
                : t(state.turn === 'player' ? 'kadan_rpg_player_turn' : 'kadan_rpg_enemy_turn', language)}
            </div>

            {/* 상단 닫기/메뉴 버튼 */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 text-slate-400 transition-all flex items-center justify-center cursor-pointer"
              title="닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top: Opponent Hand (Back face cards) */}
        <div className="w-full flex justify-center h-16 sm:h-20 md:h-22 overflow-visible relative z-10 my-1 shrink-0">
          <div className="flex items-center justify-center gap-1 md:gap-1.5">
            {state.aiHand.map((card, idx) => {
              const mid = (state.aiHand.length - 1) / 2;
              const dist = idx - mid;
              const yOffset = Math.abs(dist) * 2;

              return (
                <motion.div
                  key={`ai-hand-${card.id || 'card'}-${idx}`}
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{
                    y: yOffset,
                    scale: 1,
                    opacity: 1
                  }}
                  transition={{ duration: 0.15 }}
                  className="w-[14vw] max-w-[52px] sm:max-w-[62px] md:w-[7.5vh] md:max-w-[72px] aspect-[5/7] flex-shrink-0 relative rounded-lg border border-red-900/30 overflow-hidden shadow-md"
                >
                  <CardItem
                    card={card}
                    isLocked={true}
                    isOnBoard={false}
                    className="w-full h-full"
                    lowSpecMode={lowSpecMode}
                    language={language}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Middle Area: Logs, Score, Turn indicator, Board */}
        <div className="flex-1 flex flex-col justify-center items-center gap-1 md:gap-2 min-h-0 overflow-hidden w-full">
          {/* Mobile Top Score Chip */}
          <div className="md:hidden flex items-center justify-between w-full max-w-[280px] sm:max-w-xs px-3 py-1 bg-slate-950/90 border border-slate-800 rounded-full shadow-lg text-xs font-black z-20 mb-0.5">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <span className="text-[10px] opacity-70">KAD</span>
              <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-500/50 flex items-center justify-center font-mono text-[11px] font-black text-indigo-300">
                {score.player}
              </span>
            </div>
            <div className={cn(
              "px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold flex items-center gap-1 shadow-sm",
              state.turn === 'player' ? "bg-indigo-600 text-white" : "bg-rose-600 text-white"
            )}>
              {state.turn === 'player' ? (
                <><Zap size={10} className="text-yellow-300" /> YOUR TURN</>
              ) : (
                <><Cpu size={10} className="text-red-300" /> ENEMY TURN</>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-5 h-5 rounded-full bg-rose-950 border border-rose-500/50 flex items-center justify-center font-mono text-[11px] font-black text-rose-300">
                {score.ai}
              </span>
              <span className="text-[10px] opacity-70">ENY</span>
            </div>
          </div>

          {/* Main Battle Field */}
          <div className="flex items-center justify-center gap-3 md:gap-6 min-h-0 relative">
            
            {/* Left Scoreboard Flanking (Desktop Only) */}
            <div className="hidden md:flex flex-col items-center gap-2 z-20">
              {/* Turn Indicator */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.turn}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "px-2 py-3 rounded-full border font-bold uppercase text-[9px] md:text-xs tracking-[0.2em] shadow-lg flex flex-col items-center gap-2 [writing-mode:vertical-lr]",
                    state.turn === 'player'
                      ? "bg-gradient-to-b from-indigo-600 to-indigo-900 border-indigo-400/40 text-white"
                      : "bg-gradient-to-b from-rose-600 to-rose-900 border-rose-400/40 text-white"
                  )}
                >
                  {state.turn === 'player' ? (
                    <div className="flex items-center gap-1.5">
                      <Zap size={12} className="text-yellow-350" />
                      <span>{t('kadan_rpg_player_turn', language)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Cpu size={12} className="text-red-350" />
                      <span>{t('kadan_rpg_enemy_turn', language)}</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Score Board */}
              <div className="flex flex-col gap-1 items-center bg-slate-950/90 rounded-2xl p-1.5 border border-slate-800 shadow-inner shadow-black/60">
                {/* AI Score */}
                <div className="flex flex-col items-center gap-0.5 p-1 bg-rose-500/5 rounded-full border border-rose-900/20">
                  <span className="text-[6px] md:text-[8px] font-black uppercase text-rose-400">ENY</span>
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] md:text-xs font-extrabold text-rose-500 font-mono">
                    {score.ai}
                  </div>
                </div>
                
                {/* Divider */}
                <div className="py-0.5 opacity-15">
                  <div className="w-4 h-[1px] bg-slate-700" />
                </div>

                {/* Player Score */}
                <div className="flex flex-col items-center gap-0.5 p-1 bg-indigo-500/5 rounded-full border border-indigo-900/20">
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] md:text-xs font-extrabold text-indigo-400 font-mono">
                    {score.player}
                  </div>
                  <span className="text-[6px] md:text-[8px] font-black uppercase text-indigo-400">KAD</span>
                </div>
              </div>
            </div>

            {/* Board */}
            <div className={cn(
              "relative p-1 sm:p-1.5 border-2 sm:border-3 rounded-2xl md:rounded-3xl bg-[#090d16]/95 transition-all duration-300 shadow-2xl",
              state.turn === 'player'
                ? "border-blue-500/40"
                : "border-red-500/40"
            )}>
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-fit">
                {state.board.map((card, idx) => {
                  const isPlayerTurn = state.turn === 'player';
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={Boolean(card) || autoBattle || !isPlayerTurn || Boolean(state.result)}
                      onClick={() => placePlayerCard(idx)}
                      className={cn(
                        "grid-cell w-[20vw] max-w-[62px] sm:max-w-[72px] md:w-[8.5vh] md:max-w-[78px] lg:w-[9.5vh] lg:max-w-[84px] aspect-[5/7] flex items-center justify-center relative border transition-all cursor-pointer overflow-visible rounded-lg shadow-inner",
                        card ? "border-slate-700/40" : (
                          isPlayerTurn
                            ? "bg-blue-950/20 border-blue-500/30 hover:bg-blue-900/30 hover:border-blue-450/70 shadow-[inset_0_2px_8px_rgba(59,130,246,0.1)]"
                            : "bg-red-950/20 border-red-500/30 hover:bg-red-900/30 hover:border-red-450/70 shadow-[inset_0_2px_8px_rgba(239,68,68,0.1)]"
                        ),
                        !card && selectedCardIndex !== null && isPlayerTurn && "bg-blue-600/20 border-blue-450 border-2",
                        state.lastMove?.boardIndex === idx && "ring-2 ring-amber-300",
                        state.lastMove?.flippedIndices.includes(idx) && "ring-2 ring-cyan-300"
                      )}
                    >
                      {card ? (
                        <>
                          <motion.div
                            initial={{ scale: 0.85, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 p-0.5 rounded-lg overflow-hidden"
                          >
                            <CardItem
                              card={card}
                              isLocked={true}
                              isOnBoard={true}
                              className="w-full h-full"
                              lowSpecMode={lowSpecMode}
                              language={language}
                            />
                          </motion.div>
                          {/* Owner Label badge style */}
                          <div className={cn(
                            "absolute left-1 top-1 rounded px-1.5 py-0.5 text-[8px] font-black text-white shadow z-20",
                            card.owner === 'player' ? "bg-indigo-600 border border-indigo-400/50" : "bg-rose-600 border border-rose-400/50"
                          )}>
                            {card.owner === 'player' ? 'K' : 'E'}
                          </div>
                        </>
                      ) : (
                        <span className="absolute left-1.5 top-1 text-[9px] font-bold text-slate-700">{idx + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Player Hand */}
        <div className="w-full flex flex-col items-center gap-1 overflow-visible relative z-15 mt-1 shrink-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t('kadan_rpg_player_hand', language)}</p>
          
          <div className="flex items-center justify-center gap-1 md:gap-1.5 h-20 sm:h-24 md:h-26 overflow-visible relative">
            <AnimatePresence mode="popLayout">
              {state.playerHand.map((card, idx) => {
                const isSelected = selectedCardIndex === idx;
                const mid = (state.playerHand.length - 1) / 2;
                const dist = idx - mid;
                const yOffset = Math.abs(dist) * 2;

                return (
                  <motion.div
                    key={`player-hand-${card.id || 'card'}-${idx}`}
                    onClick={() => {
                      if (autoBattle || state.turn !== 'player' || state.result) return;
                      setSelectedCardIndex(idx);
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    }}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{
                      opacity: 1,
                      y: isSelected ? -16 : yOffset,
                      scale: isSelected ? 1.08 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.15 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "w-[15vw] max-w-[56px] sm:max-w-[66px] md:w-[8.5vh] md:max-w-[78px] aspect-[5/7] cursor-pointer transition-all flex-shrink-0 relative rounded-lg border border-slate-700 shadow-md",
                      isSelected && "z-50 border-indigo-400/60 shadow-lg"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -inset-1 bg-indigo-500/30 rounded-xl z-0 pointer-events-none ring-2 ring-indigo-400" />
                    )}
                    
                    <CardItem
                      card={card}
                      isLocked={state.turn !== 'player'}
                      isSelected={isSelected}
                      className="w-full h-full relative z-10"
                      lowSpecMode={lowSpecMode}
                      language={language}
                      hideStats={false}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 pt-2 md:pt-3 mt-1">
          {state.result && (
            <button
              type="button"
              onClick={() => onComplete(state.result!)}
              className="min-h-10 rounded-xl bg-indigo-650 px-6 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-600 active:scale-95 cursor-pointer"
            >
              {t('kadan_rpg_continue', language)}
            </button>
          )}
        </div>
      </div>

      {/* Battle Log Popup */}
      <AnimatePresence>
        {showBattleLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end justify-center bg-slate-950/85 p-3 md:items-center"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-[#090d16] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 p-4">
                <div className="flex items-center gap-2">
                  <ScrollText size={18} className="text-cyan-300" />
                  <h3 className="text-sm font-black text-white">{t('kadan_rpg_battle_log', language)}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBattleLog(false)}
                  className="flex min-h-10 min-w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                  aria-label={t('kadan_rpg_close', language)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[50vh] space-y-2.5 overflow-y-auto p-5">
                {state.log.length === 0 ? (
                  <p className="rounded-xl bg-white/5 border border-white/10 p-4 text-xs font-semibold text-slate-400">{t('kadan_rpg_battle_ready', language)}</p>
                ) : (
                  state.log.map((line, index) => (
                    <p key={`${line}-${index}`} className="rounded-xl bg-white/5 border border-white/10 p-4 text-xs font-semibold leading-relaxed text-slate-350">
                      {line}
                    </p>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Skill Activation Overlay */}
      <AnimatePresence>
        {activeSkillEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 z-[12000] pointer-events-none flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Ripple Wave Background Rings */}
            <div className={cn(
              "absolute w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] border-8 rounded-full animate-ping opacity-60",
              activeSkillEffect.color === 'red' && "border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.8)]",
              activeSkillEffect.color === 'purple' && "border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.8)]",
              activeSkillEffect.color === 'green' && "border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.8)]"
            )} />
            <div className={cn(
              "absolute w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] border-4 rounded-full animate-pulse opacity-80",
              activeSkillEffect.color === 'red' && "border-amber-400",
              activeSkillEffect.color === 'purple' && "border-fuchsia-400",
              activeSkillEffect.color === 'green' && "border-teal-300"
            )} />

            {/* Floating Skill Banner Popup */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={cn(
                "relative z-10 px-8 py-4 rounded-2xl border-2 shadow-2xl flex items-center gap-4",
                activeSkillEffect.color === 'red' && "bg-gradient-to-r from-red-950 via-red-900 to-amber-950 border-red-500 text-red-100 shadow-red-900/50",
                activeSkillEffect.color === 'purple' && "bg-gradient-to-r from-purple-950 via-purple-900 to-fuchsia-950 border-purple-500 text-purple-100 shadow-purple-900/50",
                activeSkillEffect.color === 'green' && "bg-gradient-to-r from-emerald-950 via-teal-900 to-green-950 border-emerald-500 text-emerald-100 shadow-emerald-900/50"
              )}
            >
              <activeSkillEffect.icon size={36} className="animate-bounce shrink-0" />
              <div className="flex flex-col font-mono">
                <span className="text-xl sm:text-2xl font-black italic uppercase tracking-wider font-mono">
                  {language === 'ko' ? activeSkillEffect.titleKo : activeSkillEffect.titleEn}
                </span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-80">
                  {language === 'ko' ? '스킬 발동!' : 'SKILL ACTIVATED!'}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Active Skills UI */}
      {!state.result && (
        <div className="fixed bottom-28 right-3 sm:right-4 z-[150] pointer-events-auto flex flex-col items-end gap-2">
          {/* 강화 함성 */}
          <div className="relative group">
            <button
              type="button"
              disabled={(skillCooldowns[1] || 0) > 0 || Boolean(activeSkillEffect)}
              onClick={() => handleExecuteSkill(1)}
              className={cn(
                "w-12 h-12 rounded-full border-2 shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-black border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white",
                ((skillCooldowns[1] || 0) > 0 || Boolean(activeSkillEffect)) && "opacity-50 cursor-not-allowed"
              )}
              title="강화 함성"
            >
              <Flame size={18} className="animate-pulse" />
              {(skillCooldowns[1] || 0) > 0 && (
                <span className="absolute text-[11px] font-black text-white">{skillCooldowns[1]}</span>
              )}
            </button>
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/95 text-white px-2.5 py-1 text-[10px] font-black italic opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/20 rounded-lg uppercase tracking-widest z-[200] shadow-xl">
              {language === 'ko' ? '강화 함성' : 'Rallying Roar'}
            </div>
          </div>

          {/* 약화 함정 */}
          <div className="relative group">
            <button
              type="button"
              disabled={(skillCooldowns[5] || 0) > 0 || Boolean(activeSkillEffect)}
              onClick={() => handleExecuteSkill(5)}
              className={cn(
                "w-12 h-12 rounded-full border-2 shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-black border-purple-500/50 text-purple-400 hover:bg-purple-600 hover:text-white",
                ((skillCooldowns[5] || 0) > 0 || Boolean(activeSkillEffect)) && "opacity-50 cursor-not-allowed"
              )}
              title="약화 함정"
            >
              <TargetIcon size={18} />
              {(skillCooldowns[5] || 0) > 0 && (
                <span className="absolute text-[11px] font-black text-white">{skillCooldowns[5]}</span>
              )}
            </button>
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/95 text-white px-2.5 py-1 text-[10px] font-black italic opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/20 rounded-lg uppercase tracking-widest z-[200] shadow-xl">
              {language === 'ko' ? '약화 함정' : 'Weaken Trap'}
            </div>
          </div>

          {/* 체인지 내카드 */}
          <div className="relative group">
            <button
              type="button"
              disabled={(skillCooldowns[8] || 0) > 0 || Boolean(activeSkillEffect)}
              onClick={() => handleExecuteSkill(8)}
              className={cn(
                "w-12 h-12 rounded-full border-2 shadow-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-black border-green-500/50 text-green-400 hover:bg-green-600 hover:text-white",
                ((skillCooldowns[8] || 0) > 0 || Boolean(activeSkillEffect)) && "opacity-50 cursor-not-allowed"
              )}
              title="체인지 내카드"
            >
              <RotateCcw size={18} />
              {(skillCooldowns[8] || 0) > 0 && (
                <span className="absolute text-[11px] font-black text-white">{skillCooldowns[8]}</span>
              )}
            </button>
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black/95 text-white px-2.5 py-1 text-[10px] font-black italic opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/20 rounded-lg uppercase tracking-widest z-[200] shadow-xl">
              {language === 'ko' ? '체인지 내카드' : 'Swap Self'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
