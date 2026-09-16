import React, { useState, useEffect } from 'react';
import { triggerHaptic } from '../lib/haptic';
import { Bookmark, Plus, Trash2, Pin } from 'lucide-react';

export interface ReplayTurnStep {
  turn: number;
  player: 'USER' | 'OPPONENT';
  cardName: string;
  position: number; // 0~8
  capturedCount: number;
  boardStateSnapshot: string[];
}

export interface ReplayNotePin {
  turn: number; // 1~9
  note: string;
  createdAt: number;
}

export interface BattleReplayData {
  matchId: string;
  timestamp: number;
  userDeck: string[];
  opponentDeck: string[];
  winner: 'USER' | 'OPPONENT' | 'DRAW';
  steps: ReplayTurnStep[];
}

interface BattleReplayPlayerModalProps {
  isOpen: boolean;
  replayData?: BattleReplayData | null;
  onClose: () => void;
}

/**
 * ID 360, 399, 605: 배틀 리플레이 뷰어 모달 (타임스탬프 주석 핀, 1x/2x/4x 배속, 턴 스킵, 공유 코드 복사)
 */
export const BattleReplayPlayerModal: React.FC<BattleReplayPlayerModalProps> = ({
  isOpen,
  replayData,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // ID 605: Timestamped Replay Notes State
  const storageKey = `hero_replay_notes_${replayData?.matchId || 'demo'}`;
  const [replayNotes, setReplayNotes] = useState<ReplayNotePin[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { turn: 1, note: 'Opening corner play', createdAt: Date.now() - 30000 },
      { turn: 3, note: 'Comeback setup', createdAt: Date.now() - 20000 },
      { turn: 5, note: 'Combo cascade flip', createdAt: Date.now() - 10000 },
    ];
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  // mock fallback if not provided
  const dummySteps: ReplayTurnStep[] = [
    { turn: 1, player: 'USER', cardName: '인플루언서 릴리', position: 4, capturedCount: 0, boardStateSnapshot: Array(9).fill('') },
    { turn: 2, player: 'OPPONENT', cardName: '사이버 네코', position: 1, capturedCount: 1, boardStateSnapshot: Array(9).fill('') },
    { turn: 3, player: 'USER', cardName: '해커 제로', position: 0, capturedCount: 1, boardStateSnapshot: Array(9).fill('') },
    { turn: 4, player: 'OPPONENT', cardName: '아이돌 벨라', position: 2, capturedCount: 0, boardStateSnapshot: Array(9).fill('') },
    { turn: 5, player: 'USER', cardName: 'AI 신드롬', position: 7, capturedCount: 2, boardStateSnapshot: Array(9).fill('') },
  ];

  const steps = replayData?.steps && replayData.steps.length > 0 ? replayData.steps : dummySteps;

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setCopyFeedback(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      const interval = 1200 / playbackSpeed;
      timer = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, steps.length]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex] || steps[0];

  const handleCopyCode = () => {
    const code = `SNSHERO-REPLAY-${replayData?.matchId || Date.now().toString(36).toUpperCase()}-${steps.length}T`;
    navigator.clipboard?.writeText(code).then(() => {
      setCopyFeedback(true);
      triggerHaptic('victory');
      setTimeout(() => setCopyFeedback(false), 2000);
    });

  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStepIndex(prev => Math.max(0, prev - 1));
    triggerHaptic('light');
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1));
    triggerHaptic('light');
  };

  // ID 605: 1-Tap Jump to Turn via Bookmark Chip
  const handleJumpToTurn = (turnNum: number) => {
    setIsPlaying(false);
    const targetIdx = steps.findIndex(s => s.turn === turnNum);
    if (targetIdx >= 0) {
      setCurrentStepIndex(targetIdx);
    } else {
      setCurrentStepIndex(Math.min(steps.length - 1, Math.max(0, turnNum - 1)));
    }
    triggerHaptic('selection');
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const curTurn = currentStep.turn;
    const newPin: ReplayNotePin = {
      turn: curTurn,
      note: newNoteText.trim(),
      createdAt: Date.now(),
    };
    const updated = [...replayNotes.filter(n => n.turn !== curTurn), newPin].sort((a, b) => a.turn - b.turn);
    setReplayNotes(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    setNewNoteText('');
    setShowNoteInput(false);
    triggerHaptic('badge_pop');
  };

  const handleDeleteNote = (turnNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = replayNotes.filter(n => n.turn !== turnNum);
    setReplayNotes(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
    triggerHaptic('light');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] dark:bg-[#1a1717] border border-[#201d1d]/20 dark:border-white/20 p-5 max-w-md w-full shadow-2xl rounded-none flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#201d1d]/60 dark:text-white/60">
              [TACTICAL REPLAY VIEWER]
            </span>
            <h3 className="text-sm font-black text-[#201d1d] dark:text-white">
              배틀 리플레이 플레이어
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 border border-[#201d1d]/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5"
          >
            [X]
          </button>
        </div>

        {/* Current Status HUD */}
        <div className="bg-black/5 dark:bg-white/5 p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground text-[10px]">CURRENT TURN</span>
            <div className="font-bold">
              Turn {currentStep.turn} / {steps.length}
            </div>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground text-[10px]">ACTIVE PLAYER</span>
            <div className={`font-black ${currentStep.player === 'USER' ? 'text-blue-600' : 'text-red-500'}`}>
              {currentStep.player === 'USER' ? '● PLAYER' : '▲ OPPONENT'}
            </div>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground text-[10px]">CAPTURES</span>
            <div className="font-bold text-amber-600">
              +{currentStep.capturedCount}장 전환
            </div>
          </div>
        </div>

        {/* Board Simulation Placeholder 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2 bg-black/10 dark:bg-white/10 p-3 rounded-xs aspect-square max-w-[260px] mx-auto w-full">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isLatest = currentStep.position === idx;
            return (
              <div
                key={idx}
                className={`border flex flex-col items-center justify-center text-[10px] p-1 transition-all ${
                  isLatest
                    ? currentStep.player === 'USER'
                      ? 'border-blue-500 bg-blue-500/20 font-bold scale-105'
                      : 'border-red-500 bg-red-500/20 font-bold scale-105'
                    : 'border-[#201d1d]/20 dark:border-white/20 bg-white/40 dark:bg-black/40 text-[#201d1d]/50 dark:text-white/50'
                }`}
              >
                <span>#{idx + 1}</span>
                {isLatest && (
                  <span className="text-[9px] truncate max-w-full font-bold">
                    {currentStep.cardName.slice(0, 4)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ID 605: Timestamped Replay Notes & Interactive Bookmark Chips */}
        <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded-none border border-[#201d1d]/10 dark:border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#646262] uppercase flex items-center gap-1">
              <Pin size={11} className="text-amber-600" />
              <span>[REPLAY NOTES &amp; TIMESTAMPS]</span>
            </span>
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="text-[10px] font-bold px-1.5 py-0.5 border border-[rgba(15,0,0,0.12)] hover:bg-black/5 rounded-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus size={10} />
              <span>{showNoteInput ? '[취소]' : `[+ Turn ${currentStep.turn} 핀]`}</span>
            </button>
          </div>

          {/* New Note Input Form */}
          {showNoteInput && (
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={`Turn ${currentStep.turn} 주석 입력 (예: Comeback setup)`}
                className="flex-1 px-2 py-1 bg-white dark:bg-black border border-[#201d1d]/20 text-[11px] rounded-xs font-mono outline-hidden"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="px-2 py-1 bg-[#201d1d] text-white text-[10px] font-bold rounded-xs disabled:opacity-40 cursor-pointer"
              >
                [등록]
              </button>
            </div>
          )}

          {/* Interactive Bookmark Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {replayNotes.length === 0 ? (
              <div className="text-[10px] text-[#646262] py-0.5">등록된 턴 주석이 없습니다.</div>
            ) : (
              replayNotes.map((pin) => {
                const isActive = currentStep.turn === pin.turn;
                return (
                  <div
                    key={`${pin.turn}-${pin.createdAt}`}
                    onClick={() => handleJumpToTurn(pin.turn)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-xs border text-[10px] cursor-pointer shrink-0 transition-all active:scale-95 ${
                      isActive
                        ? 'bg-amber-400 text-stone-950 border-amber-600 font-black shadow-2xs'
                        : 'bg-white/60 dark:bg-black/40 border-[#201d1d]/15 text-[#201d1d] dark:text-white hover:bg-amber-100/50'
                    }`}
                    title={`클릭 시 Turn ${pin.turn}으로 즉시 점프`}
                  >
                    <span>📌 Turn {pin.turn}:</span>
                    <span className="font-bold truncate max-w-[110px]">{pin.note}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNote(pin.turn, e)}
                      className="ml-0.5 text-stone-500 hover:text-rose-600 text-[9px] px-0.5"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Playback Controls (ID 399) */}
        <div className="flex items-center justify-between border-t border-b border-[#201d1d]/10 dark:border-white/10 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex <= 0}
              className="px-2 py-1 border border-[#201d1d]/20 dark:border-white/20 text-xs disabled:opacity-30 active:scale-95"
            >
              [|&lt;]
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 bg-[#201d1d] text-white dark:bg-white dark:text-[#201d1d] text-xs font-bold active:scale-95"
            >
              {isPlaying ? '[PAUSE]' : '[PLAY]'}
            </button>
            <button
              onClick={handleNext}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-2 py-1 border border-[#201d1d]/20 dark:border-white/20 text-xs disabled:opacity-30 active:scale-95"
            >
              [&gt;|]
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs">
            {([1, 2, 4] as const).map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 text-[11px] font-bold ${
                  playbackSpeed === speed
                    ? 'bg-amber-500 text-black'
                    : 'border border-[#201d1d]/20 dark:border-white/20'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Share & Copy Code (ID 360) */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleCopyCode}
            className="flex-1 py-2 px-3 border border-dashed border-[#201d1d]/40 dark:border-white/40 text-xs font-bold text-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-98"
          >
            {copyFeedback ? '✓ 리플레이 코드가 복사되었습니다!' : '[+] 리플레이 공유 코드 복사'}
          </button>
        </div>
      </div>
    </div>
  );
};
