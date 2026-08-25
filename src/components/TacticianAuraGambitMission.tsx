import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CardData, Language } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface TacticianAuraGambitMissionProps {
  deck: CardData[];
  language: Language;
  lowSpecMode?: boolean;
  playSfx: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

type GambitStance = 'aggressive' | 'balanced' | 'defensive';

export const TacticianAuraGambitMission: React.FC<TacticianAuraGambitMissionProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward,
}) => {
  const isKo = language === 'ko';
  const [stance, setStance] = useState<GambitStance>('balanced');
  const [tacticsAura, setTacticsAura] = useState<'flame' | 'water' | 'wind' | 'earth'>('flame');
  const [myHp, setMyHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [battleTurn, setBattleTurn] = useState(1);
  const maxTurns = 5;
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [tacticsLog, setTacticsLog] = useState<string>('');
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_mission_tactician_gambit') !== 'true';
    } catch {
      return true;
    }
  });
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const startTimeRef = useRef(Date.now());

  const initGame = useCallback(() => {
    setStance('balanced');
    setTacticsAura('flame');
    setMyHp(100);
    setEnemyHp(100);
    setBattleTurn(1);
    setTacticsLog(isKo ? '전술가 마스터리 AI 갬빗 시뮬레이션 개시' : 'Tactician Mastery AI Gambit Simulation Started');
    setIsGameOver(false);
    setSettlementReceipt(null);
    startTimeRef.current = Date.now();
  }, [isKo]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const runTurn = () => {
    if (isGameOver || isPaused) return;

    let pDmg = 25;
    let eDmg = 20;

    if (stance === 'aggressive') {
      pDmg = 40;
      eDmg = 30;
    } else if (stance === 'defensive') {
      pDmg = 18;
      eDmg = 10;
    }

    if (tacticsAura === 'flame') pDmg += 10;
    if (tacticsAura === 'water') eDmg = Math.max(0, eDmg - 8);
    if (tacticsAura === 'wind') pDmg += Math.random() < 0.5 ? 20 : 0;
    if (tacticsAura === 'earth') eDmg = Math.max(0, eDmg - 5);

    const nextEnemyHp = Math.max(0, enemyHp - pDmg);
    const nextMyHp = Math.max(0, myHp - eDmg);

    setEnemyHp(nextEnemyHp);
    setMyHp(nextMyHp);
    setTacticsLog(
      isKo
        ? `턴 ${battleTurn}: [${stance.toUpperCase()}] 가한 피해 ${pDmg} | 받은 피해 ${eDmg}`
        : `Turn ${battleTurn}: [${stance.toUpperCase()}] Dealt ${pDmg} | Received ${eDmg}`
    );
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

    if (nextEnemyHp <= 0 || nextMyHp <= 0 || battleTurn >= maxTurns) {
      setIsGameOver(true);
      const isVictory = nextEnemyHp <= 0 || nextMyHp > nextEnemyHp;
      if (isVictory) {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      } else {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      }

      const duration = (Date.now() - startTimeRef.current) / 1000;
      const receipt = calculateAndDepositMissionReward({
        gameId: 'mission_tactician_gambit',
        gameTitle: '전술가 아우라 & 갬빗',
        durationSeconds: duration,
        score: nextMyHp * 20 + (isVictory ? 3000 : 800),
        difficulty: 'NIGHTMARE',
        isVictory: isVictory
      });
      setSettlementReceipt(receipt);
      onReward(receipt.totalSns);
      return;
    }

    setBattleTurn(t => t + 1);
  };

  const tutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 5턴 AI 갬빗 승리' : 'STEP 1: 5-TURN GAMBIT WIN',
      title: isKo ? '스탠스 & 아우라 최적화 전술' : 'Optimize Stance & Aura',
      description: isKo
        ? '공격/균형/수비 스탠스와 4대 원소 아우라를 조합하여 5턴 내에 적 전술가를 제압하세요.'
        : 'Combine aggressive/defensive stances and element auras to defeat enemy in 5 turns.',
      keyPoints: isKo
        ? [
            '5턴 내 적 체력 격파 시 완승',
            '공격 스탠스는 폭딜 / 수비 스탠스는 피해 감소',
            '4원소 아우라별 고유 패시브 효과'
          ]
        : [
            'Deplete enemy HP in 5 turns to win',
            'Aggressive grants burst / Defensive reduces dmg',
            '4 Element Auras provide unique passive buffs'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '스탠스/아우라 원터치 전환' : 'One-Touch Tactics Toggle',
      description: isKo
        ? '스탠스와 아우라 버튼을 탭하여 즉시 전술을 변경하고 턴을 진행합니다.'
        : 'Tap stance and aura buttons to pivot tactics instantly.',
      keyPoints: isKo
        ? [
            '⚔️ 스탠스 전환: 공격 / 밸런스 / 방어',
            '🔮 아우라 전환: 불 / 물 / 바람 / 땅',
            '⚡ 원터치 턴 시뮬레이션 실행'
          ]
        : [
            '⚔️ Stance Toggle: Aggressive / Balanced / Defensive',
            '🔮 Aura Toggle: Flame / Water / Wind / Earth',
            '⚡ One-touch turn simulation execution'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '시뮬레이션 완료 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare payout deposited atomically to your LocalStorage wallet upon simulation finish.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '잔여 체력 및 전술 마스터리 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Remaining HP and mastery multipliers',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcfc] text-[#201d1d] font-mono select-none flex flex-col overflow-hidden items-center justify-between">
      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '전술가 갬빗' : 'Tactician Gambit'}
        language={language}
        hp={{ current: myHp, max: 100 }}
        telemetries={[
          { label: isKo ? '턴' : 'Turn', value: `${battleTurn}/${maxTurns}`, color: 'text-amber-600 font-bold' },
          { label: isKo ? '적군' : 'Enemy', value: `${enemyHp}HP`, color: 'text-rose-600 font-bold' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => setIsPaused(prev => !prev)}
        isPaused={isPaused}
      />

      {/* Gambit Arena Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden p-3 w-full max-w-sm">
        {/* Tactics Log */}
        <div className="w-full max-w-xs p-3 bg-white border border-[rgba(15,0,0,0.15)] text-center text-xs font-mono text-slate-700 shadow-xs mb-3 min-h-[44px] flex items-center justify-center">
          {tacticsLog}
        </div>

        {/* Stance Selector */}
        <div className="w-full max-w-xs mb-3 space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase">{isKo ? '전술 스탠스' : 'Tactical Stance'}</div>
          <div className="flex gap-1">
            {(['aggressive', 'balanced', 'defensive'] as GambitStance[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStance(s)}
                className={`flex-1 py-2 text-xs font-bold border rounded-none transition-all ${
                  stance === s
                    ? 'bg-[#201d1d] text-white border-[#201d1d]'
                    : 'bg-white text-slate-700 border-[rgba(15,0,0,0.15)]'
                }`}
              >
                {s === 'aggressive' ? '⚔️ 공격' : s === 'balanced' ? '⚖️ 균형' : '🛡️ 수비'}
              </button>
            ))}
          </div>
        </div>

        {/* Aura Selector */}
        <div className="w-full max-w-xs space-y-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase">{isKo ? '전장 아우라' : 'Battlefield Aura'}</div>
          <div className="grid grid-cols-4 gap-1">
            {(['flame', 'water', 'wind', 'earth'] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setTacticsAura(a)}
                className={`py-2 text-xs font-bold border rounded-none transition-all ${
                  tacticsAura === a
                    ? 'bg-amber-500 text-[#201d1d] border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-[rgba(15,0,0,0.15)]'
                }`}
              >
                {a === 'flame' ? '🔥 불' : a === 'water' ? '💧 물' : a === 'wind' ? '🌪️ 바람' : '🌍 땅'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Execute Turn Button */}
      <div className="shrink-0 w-full max-w-sm px-4 pb-4 flex items-center justify-center">
        <button
          type="button"
          onClick={runTurn}
          disabled={isGameOver || isPaused}
          className="w-full py-3.5 bg-[#201d1d] text-white rounded-none font-bold text-sm active:scale-95 transition-all shadow-xs"
        >
          ⚡ {isKo ? `턴 ${battleTurn} 전술 실행` : `Execute Turn ${battleTurn}`}
        </button>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="mission_tactician_gambit"
          gameTitle={isKo ? '전술가 아우라 & 갬빗 미션' : 'Tactician Aura & Gambit Mission'}
          customSteps={tutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Victory Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={initGame}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default TacticianAuraGambitMission;
