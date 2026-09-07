import React, { useState, useEffect, useRef } from 'react';
import { MinimalistMissionHUD } from '../MinimalistMissionHUD';
import { VictoryRewardModal } from '../VictoryRewardModal';
import { calculateAndDepositMissionReward } from '../../lib/standardizedRewardGateway';
import { drawCardSprite } from '../../lib/canvasCardRenderer';

interface PokiFamilyLifeGameProps {
  onBack: () => void;
  cardId?: number;
}

interface LifeChoice {
  text: string;
  subtext: string;
  hapDelta: number;
  wealthDelta: number;
  harmDelta: number;
}

interface LifeStage {
  title: string;
  age: string;
  situation: string;
  optA: LifeChoice;
  optB: LifeChoice;
}

const LIFE_STAGES: LifeStage[] = [
  {
    title: '신혼 첫걸음 & 보금자리',
    age: '28세',
    situation: '결혼 후 첫 살림집을 구해야 합니다. 어떤 결정을 내릴까요?',
    optA: {
      text: '알뜰한 전세 빌라',
      subtext: '대출을 최소화하고 저축을 우선시합니다.',
      hapDelta: 10,
      wealthDelta: 20,
      harmDelta: 15,
    },
    optB: {
      text: '쾌적한 신축 아파트',
      subtext: '대출을 내더라도 행복한 주거환경을 선택합니다.',
      hapDelta: 25,
      wealthDelta: -10,
      harmDelta: 15,
    },
  },
  {
    title: '첫 아이의 탄생',
    age: '30세',
    situation: '귀여운 아기가 태어났습니다! 육아 휴직과 복직 계획은?',
    optA: {
      text: '부부 공동 육아 휴직',
      subtext: '아이의 첫 1년을 부부가 온전히 함께합니다.',
      hapDelta: 25,
      wealthDelta: -10,
      harmDelta: 25,
    },
    optB: {
      text: '열정적인 조기 복직',
      subtext: '커리어를 지키며 양가 부모님의 도움을 받습니다.',
      hapDelta: 10,
      wealthDelta: 25,
      harmDelta: 10,
    },
  },
  {
    title: '반려견 입양 가족 회의',
    age: '33세',
    situation: '아이가 길 잃은 강아지를 보고 키우고 싶다고 조릅니다.',
    optA: {
      text: '사랑으로 유기견 입양',
      subtext: '생명의 소중함을 배우며 새 가족을 맞이합니다.',
      hapDelta: 20,
      wealthDelta: -5,
      harmDelta: 20,
    },
    optB: {
      text: '장난감 강아지로 달래기',
      subtext: '아직은 바쁜 일상이라 나중으로 미룹니다.',
      hapDelta: -5,
      wealthDelta: 10,
      harmDelta: 5,
    },
  },
  {
    title: '자녀 초등학교 입학 & 교육',
    age: '37세',
    situation: '아이가 초등학교에 입학했습니다. 방과 후 활동은?',
    optA: {
      text: '자연 체험 & 예체능',
      subtext: '주말마다 캠핑과 악기, 축구를 함께 즐깁니다.',
      hapDelta: 20,
      wealthDelta: -10,
      harmDelta: 20,
    },
    optB: {
      text: '선행 학습 & 영재 코딩',
      subtext: '미래를 위한 든든한 학업 경쟁력을 키웁니다.',
      hapDelta: 10,
      wealthDelta: -15,
      harmDelta: 10,
    },
  },
  {
    title: '커리어 대전환',
    age: '42세',
    situation: '오랜 직장 생활 중 새로운 창업 아이템 제안이 왔습니다.',
    optA: {
      text: '안정적인 직장 근속',
      subtext: '가족의 안정을 위해 정년까지 최선을 다합니다.',
      hapDelta: 10,
      wealthDelta: 15,
      harmDelta: 15,
    },
    optB: {
      text: '혁신 스타트업 창업',
      subtext: '가족의 열렬한 응원과 함께 꿈에 도전합니다.',
      hapDelta: 20,
      wealthDelta: 20,
      harmDelta: 10,
    },
  },
  {
    title: '가족 꿈의 유럽 여행',
    age: '46세',
    situation: '결혼 20주년 기념 가족 여행 계획을 세웁니다.',
    optA: {
      text: '한 달간의 유럽 낭만 배낭여행',
      subtext: '가족 모두에게 평생 잊지 못할 추억을 선물합니다.',
      hapDelta: 30,
      wealthDelta: -20,
      harmDelta: 25,
    },
    optB: {
      text: '국내 온천 힐링 여행 & 펀드 투자',
      subtext: '실속 있게 휴식하고 남은 예산을 미래에 투자합니다.',
      hapDelta: 15,
      wealthDelta: 15,
      harmDelta: 15,
    },
  },
  {
    title: '자녀의 독립과 성인식',
    age: '50세',
    situation: '성인이 된 자녀가 첫 독립 자취를 선언했습니다.',
    optA: {
      text: '따뜻한 보증금 지원 & 응원',
      subtext: '새로운 세상으로 나아가는 아이를 든든하게 돕습니다.',
      hapDelta: 20,
      wealthDelta: -15,
      harmDelta: 20,
    },
    optB: {
      text: '스스로 아르바이트 자립 장려',
      subtext: '독립심과 강한 생활력을 기르도록 곁에서 조언합니다.',
      hapDelta: 10,
      wealthDelta: 10,
      harmDelta: 15,
    },
  },
  {
    title: '전원주택 정원 가꾸기',
    age: '55세',
    situation: '도심을 벗어나 주말 텃밭이 있는 집을 가꿔볼까요?',
    optA: {
      text: '꽃과 나무 가득한 온실 정원',
      subtext: '유기농 채소를 가꾸며 평화로운 일상을 누립니다.',
      hapDelta: 25,
      wealthDelta: -10,
      harmDelta: 20,
    },
    optB: {
      text: '도심 문화센터 취미 동호회',
      subtext: '영화, 미술관, 독서 클럽에서 활기차게 소통합니다.',
      hapDelta: 20,
      wealthDelta: -5,
      harmDelta: 15,
    },
  },
  {
    title: '황혼의 은혼식 리마인드 웨딩',
    age: '60세',
    situation: '자녀들과 손주들이 모여 부부의 은혼식을 축하해줍니다.',
    optA: {
      text: '손주들과 함께하는 홈파티',
      subtext: '손수 만든 요리를 나누며 가족의 온기를 만끽합니다.',
      hapDelta: 30,
      wealthDelta: -5,
      harmDelta: 30,
    },
    optB: {
      text: '부부 둘만의 크루즈 여행',
      subtext: '수십 년간 서로를 지켜준 동반자와 푸른 바다를 누빕니다.',
      hapDelta: 30,
      wealthDelta: -15,
      harmDelta: 25,
    },
  },
  {
    title: '인생의 결실과 가족 유산',
    age: '65세',
    situation: '일생을 돌아보며 가족 장학 기금과 자서전을 집필합니다.',
    optA: {
      text: '가족 이야기 자서전 출간',
      subtext: '가족의 감동적인 추억을 책으로 엮어 후대에 전합니다.',
      hapDelta: 25,
      wealthDelta: 10,
      harmDelta: 25,
    },
    optB: {
      text: '마을 어린이 도서관 기부',
      subtext: '사회의 더 많은 아이들이 꿈을 꿀 수 있게 나눔을 실천합니다.',
      hapDelta: 30,
      wealthDelta: -10,
      harmDelta: 30,
    },
  },
];

export const PokiFamilyLifeGame: React.FC<PokiFamilyLifeGameProps> = ({ onBack, cardId = 42 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const [happiness, setHappiness] = useState(60);
  const [wealth, setWealth] = useState(50);
  const [harmony, setHarmony] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const gameStateRef = useRef({
    stageIdx: 0,
    happiness: 60,
    wealth: 50,
    harmony: 60,
    startTime: Date.now(),
    bubbles: [] as { x: number; y: number; text: string; alpha: number; vy: number }[],
    btnRectA: { x: 0, y: 0, w: 0, h: 0 },
    btnRectB: { x: 0, y: 0, w: 0, h: 0 },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const state = gameStateRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Background warm room
      ctx.fillStyle = '#fdfcf7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const stage = LIFE_STAGES[state.stageIdx] || LIFE_STAGES[0];

      // Top family portrait box
      const boxW = Math.min(canvas.width - 32, 420);
      const startX = (canvas.width - boxW) / 2;

      // Status Bars at top
      ctx.fillStyle = '#292524';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`행복: ${state.happiness}% | 자산: ${state.wealth}점 | 화목: ${state.harmony}%`, startX, 85);

      // Bar drawings
      const drawMiniBar = (val: number, max: number, y: number, color: string) => {
        ctx.fillStyle = '#e7e5e4';
        ctx.fillRect(startX, y, boxW, 8);
        ctx.fillStyle = color;
        ctx.fillRect(startX, y, (Math.min(val, max) / max) * boxW, 8);
      };
      drawMiniBar(state.happiness, 120, 95, '#f43f5e');
      drawMiniBar(state.wealth, 120, 107, '#eab308');
      drawMiniBar(state.harmony, 120, 119, '#10b981');

      // Family Card Frame
      const frameY = 140;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 1;
      ctx.fillRect(startX, frameY, boxW, 140);
      ctx.strokeRect(startX, frameY, boxW, 140);

      // Draw Hero Card Sprite in portrait
      drawCardSprite(ctx, cardId, startX + 20, frameY + 20, 70, 100);

      // Stage Title & Age Info
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`[STEP ${state.stageIdx + 1}/10] 나이: ${stage.age}`, startX + 105, frameY + 35);

      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(stage.title, startX + 105, frameY + 60);

      // Situation text wrapped
      ctx.fillStyle = '#57534e';
      ctx.font = '12px monospace';
      const words = stage.situation;
      ctx.fillText(words.slice(0, 20), startX + 105, frameY + 88);
      if (words.length > 20) {
        ctx.fillText(words.slice(20), startX + 105, frameY + 108);
      }

      // Choice Option Cards
      const btnH = 95;
      const btnY1 = frameY + 160;
      const btnY2 = btnY1 + btnH + 16;

      state.btnRectA = { x: startX, y: btnY1, w: boxW, h: btnH };
      state.btnRectB = { x: startX, y: btnY2, w: boxW, h: btnH };

      // Option A Card
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.fillRect(state.btnRectA.x, state.btnRectA.y, state.btnRectA.w, state.btnRectA.h);
      ctx.strokeRect(state.btnRectA.x, state.btnRectA.y, state.btnRectA.w, state.btnRectA.h);

      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`[A] ${stage.optA.text}`, startX + 16, btnY1 + 30);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(stage.optA.subtext.slice(0, 26), startX + 16, btnY1 + 52);
      ctx.fillStyle = '#10b981';
      ctx.font = '10px monospace';
      ctx.fillText(`행복 +${stage.optA.hapDelta} | 자산 ${stage.optA.wealthDelta >= 0 ? '+' : ''}${stage.optA.wealthDelta} | 화목 +${stage.optA.harmDelta}`, startX + 16, btnY1 + 75);

      // Option B Card
      ctx.fillStyle = '#fffbeb';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.fillRect(state.btnRectB.x, state.btnRectB.y, state.btnRectB.w, state.btnRectB.h);
      ctx.strokeRect(state.btnRectB.x, state.btnRectB.y, state.btnRectB.w, state.btnRectB.h);

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 15px monospace';
      ctx.fillText(`[B] ${stage.optB.text}`, startX + 16, btnY2 + 30);
      ctx.fillStyle = '#78716c';
      ctx.font = '11px monospace';
      ctx.fillText(stage.optB.subtext.slice(0, 26), startX + 16, btnY2 + 52);
      ctx.fillStyle = '#10b981';
      ctx.font = '10px monospace';
      ctx.fillText(`행복 +${stage.optB.hapDelta} | 자산 ${stage.optB.wealthDelta >= 0 ? '+' : ''}${stage.optB.wealthDelta} | 화목 +${stage.optB.harmDelta}`, startX + 16, btnY2 + 75);

      // Bubbles
      for (let i = state.bubbles.length - 1; i >= 0; i--) {
        const b = state.bubbles[i];
        b.y += b.vy;
        b.alpha -= 0.02;
        ctx.fillStyle = `rgba(244, 63, 94, ${Math.max(0, b.alpha)})`;
        ctx.font = 'bold 14px monospace';
        ctx.fillText(b.text, b.x, b.y);
        if (b.alpha <= 0) state.bubbles.splice(i, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [cardId]);

  const selectOption = (opt: LifeChoice) => {
    const s = gameStateRef.current;
    s.happiness = Math.max(0, s.happiness + opt.hapDelta);
    s.wealth = Math.max(0, s.wealth + opt.wealthDelta);
    s.harmony = Math.max(0, s.harmony + opt.harmDelta);

    setHappiness(s.happiness);
    setWealth(s.wealth);
    setHarmony(s.harmony);

    s.bubbles.push({
      x: window.innerWidth / 2 - 50,
      y: 280,
      text: `💖 +${opt.hapDelta} 💰 ${opt.wealthDelta >= 0 ? '+' : ''}${opt.wealthDelta}`,
      alpha: 1,
      vy: -1.5,
    });

    if (s.stageIdx + 1 >= LIFE_STAGES.length) {
      // Finished all 10 stages!
      const isWin = s.harmony >= 50 && s.happiness >= 50;
      setGameOver(true);
      setGameWon(isWin);
      const finalScore = s.happiness + s.wealth + s.harmony;
      const reward = calculateAndDepositMissionReward({
        gameId: 'pokifamilylife',
        gameTitle: 'Family Life Simulator',
        isVictory: isWin,
        score: finalScore,
        maxTargetScore: 300,
        durationSeconds: Math.floor((Date.now() - s.startTime) / 1000),
      });
      setRewardResult(reward);
    } else {
      s.stageIdx++;
      setStageIdx(s.stageIdx);
    }
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameOver) return;
    const s = gameStateRef.current;
    const { btnRectA, btnRectB } = s;
    const stage = LIFE_STAGES[s.stageIdx];
    if (!stage) return;

    if (
      clientX >= btnRectA.x &&
      clientX <= btnRectA.x + btnRectA.w &&
      clientY >= btnRectA.y &&
      clientY <= btnRectA.y + btnRectA.h
    ) {
      selectOption(stage.optA);
    } else if (
      clientX >= btnRectB.x &&
      clientX <= btnRectB.x + btnRectB.w &&
      clientY >= btnRectB.y &&
      clientY <= btnRectB.y + btnRectB.h
    ) {
      selectOption(stage.optB);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#fdfcf7] overflow-hidden select-none font-mono">
      <MinimalistMissionHUD
        gameTitle="Family Life Simulator"
        score={stageIdx + 1}
        targetScore={10}
        timeLeft={120}
        onBack={onBack}
      />

      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const t = e.touches[0];
          handlePointerDown(t.clientX, t.clientY);
        }}
      />

      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-xs text-stone-500">
        [A] 또는 [B] 카드를 탭하여 가족 인생의 중대 결정을 내리세요.
      </div>

      <VictoryRewardModal
        isOpen={gameOver}
        rewardAmount={rewardResult?.rewardAmount || 0}
        score={happiness + wealth + harmony}
        targetScore={300}
        isVictory={gameWon}
        onClose={onBack}
        onRetry={() => {
          setGameOver(false);
          setGameWon(false);
          setStageIdx(0);
          setHappiness(60);
          setWealth(50);
          setHarmony(60);
          gameStateRef.current.stageIdx = 0;
          gameStateRef.current.happiness = 60;
          gameStateRef.current.wealth = 50;
          gameStateRef.current.harmony = 60;
          gameStateRef.current.startTime = Date.now();
        }}
      />
    </div>
  );
};

export default PokiFamilyLifeGame;
