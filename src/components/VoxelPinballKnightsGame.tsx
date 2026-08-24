import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPinballKnightsGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelPinballKnightsGame: React.FC<VoxelPinballKnightsGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_tutorial_game_voxel_pinball_knights') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const targetScore = 5000;
  const [balls, setBalls] = useState<number>(3);
  const [combo, setCombo] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const gameStateRef = useRef({
    ballX: 0,
    ballZ: 5,
    ballVx: 0,
    ballVz: -18,
    score: 0,
    combo: 0,
    balls: 3,
    leftFlipperUp: false,
    rightFlipperUp: false,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    ballMesh: null as THREE.Mesh | null,
    bumpers: [] as { mesh: THREE.Mesh; x: number; z: number }[]
  });

  const triggerLeftFlipper = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.leftFlipperUp = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setTimeout(() => { s.leftFlipperUp = false; }, 150);

    if (Math.abs(s.ballZ - 10) < 2.5 && s.ballX < 0 && s.ballX > -6) {
      s.ballVz = -30 - Math.random() * 10;
      s.ballVx = 10 + Math.random() * 10;
    }
  };

  const triggerRightFlipper = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.rightFlipperUp = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setTimeout(() => { s.rightFlipperUp = false; }, 150);

    if (Math.abs(s.ballZ - 10) < 2.5 && s.ballX > 0 && s.ballX < 6) {
      s.ballVz = -30 - Math.random() * 10;
      s.ballVx = -10 - Math.random() * 10;
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120826);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 24, 18);
    camera.lookAt(0, 0, -2);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const pinLight = new THREE.PointLight(0xff00ff, 2, 50);
    pinLight.position.set(0, 15, 0);
    scene.add(pinLight);

    // Table Playfield
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(16, 1, 26),
      new THREE.MeshLambertMaterial({ color: 0x221133 })
    );
    table.position.y = -0.5;
    scene.add(table);

    // Ball
    const bGeo = new THREE.SphereGeometry(0.6, 16, 16);
    const bMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.9 });
    const ballMesh = new THREE.Mesh(bGeo, bMat);
    ballMesh.position.set(0, 0.6, 5);
    scene.add(ballMesh);
    gameStateRef.current.ballMesh = ballMesh;

    // Bumpers
    gameStateRef.current.bumpers = [];
    const bCoords = [[-4, -6], [4, -6], [0, -10], [-3, 0], [3, 0]];
    bCoords.forEach(([bx, bz]) => {
      const bmp = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 1, 16),
        new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xbe185d })
      );
      bmp.position.set(bx, 0.5, bz);
      scene.add(bmp);
      gameStateRef.current.bumpers.push({ mesh: bmp, x: bx, z: bz });
    });

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = gameStateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Ball Physics
      s.ballVz += 12 * dt; // gravity down slope
      s.ballX += s.ballVx * dt;
      s.ballZ += s.ballVz * dt;

      // Wall rebound
      if (s.ballX < -7) { s.ballX = -7; s.ballVx = Math.abs(s.ballVx); }
      if (s.ballX > 7) { s.ballX = 7; s.ballVx = -Math.abs(s.ballVx); }
      if (s.ballZ < -12) { s.ballZ = -12; s.ballVz = Math.abs(s.ballVz); }

      // Bumper Hit Check
      s.bumpers.forEach(b => {
        const dist = Math.hypot(s.ballX - b.x, s.ballZ - b.z);
        if (dist < 1.8) {
          const angle = Math.atan2(s.ballZ - b.z, s.ballX - b.x);
          s.ballVx = Math.cos(angle) * 22;
          s.ballVz = Math.sin(angle) * 22;
          s.combo += 1;
          s.score += 250 * s.combo;

          setScore(s.score);
          setCombo(s.combo);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.score >= targetScore && !s.isGameOver) {
            s.isVictory = true;
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_pinball_knights',
              gameTitle: '복셀 핀볼 나이츠',
              durationSeconds: duration,
              score: s.score + 2500,
              difficulty: 'NIGHTMARE',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }
      });

      // Bottom Drain Check
      if (s.ballZ > 14) {
        s.balls -= 1;
        setBalls(s.balls);
        s.combo = 0;
        setCombo(0);

        if (s.balls > 0) {
          s.ballX = 0;
          s.ballZ = 5;
          s.ballVx = (Math.random() - 0.5) * 8;
          s.ballVz = -20;
        } else if (!s.isGameOver) {
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_pinball_knights',
            gameTitle: '복셀 핀볼 나이츠',
            durationSeconds: duration,
            score: s.score,
            difficulty: 'NIGHTMARE',
            isVictory: false
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }

      if (ballMesh) {
        ballMesh.position.set(s.ballX, 0.6, s.ballZ);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  const handleRestart = () => {
    const s = gameStateRef.current;
    s.ballX = 0;
    s.ballZ = 5;
    s.ballVx = 0;
    s.ballVz = -18;
    s.score = 0;
    s.combo = 0;
    s.balls = 3;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setScore(0);
    setCombo(0);
    setBalls(3);
    setIsGameOver(false);
    setSettlementReceipt(null);
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 나이츠 핀볼 대전' : 'STEP 1: PINBALL DUEL',
      title: isKo ? '5,000점 달성 챔피언' : 'Reach 5,000 Points',
      description: isKo
        ? '화려한 범퍼와 콤보 타격으로 5,000점을 달성하여 핀볼 나이츠의 기사 칭호를 획득하세요.'
        : 'Score 5,000 points through bumper strikes and combo chains to earn Knight title.',
      keyPoints: isKo
        ? [
            '5,000점 달성 시 즉시 완승',
            '연속 범퍼 타격 시 콤보 폭발',
            '볼 3개 내에 완료'
          ]
        : [
            'Reach 5,000P to win',
            'Chain consecutive bumper combos',
            'Clear within 3 balls'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 조작' : 'STEP 2: PURE GESTURES',
      title: isKo ? '좌/우 화면 분할 플리퍼' : 'Split Touch Paddles',
      description: isKo
        ? '화면 왼쪽을 누르면 좌측 플리퍼, 오른쪽을 누르면 우측 플리퍼가 작동합니다.'
        : 'Touch left screen half for left paddle, right half for right paddle with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 화면 좌측 터치: 좌측 플리퍼',
            '👆 화면 우측 터치: 우측 플리퍼',
            '⚡ 타이밍 타격 시 초고속 리바운드'
          ]
        : [
            '👆 Touch Left: Left flipper',
            '👆 Touch Right: Right flipper',
            '⚡ Perfect timing super rebound'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '핀볼 승리 즉시 NIGHTMARE 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Nightmare multiplier payout calculated and deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '최고 점수 및 콤보 팡파레 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'High score and combo multiplier bonuses',
            'VictoryRewardModal golden coin fanfare'
          ],
      iconType: 'REWARDS'
    }
  ];

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* 1-Line Minimalist Glass HUD per design.md (Top 5%) */}
      <MinimalistMissionHUD
        title={isKo ? '복셀 핀볼 나이츠' : 'Voxel Pinball Knights'}
        language={language}
        telemetries={[
          { label: isKo ? '점수' : 'Score', value: `${score}/${targetScore}`, color: score >= targetScore ? 'text-amber-400 font-bold animate-pulse' : 'text-yellow-300' },
          { label: isKo ? '볼' : 'Balls', value: `x${balls}`, color: balls <= 1 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: combo > 1 ? 'text-emerald-400 font-bold' : 'text-slate-400' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          gameStateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Screen Touch Flipper Overlay (Left / Right Half Screen) */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div className="absolute inset-0 z-10 flex select-none touch-none cursor-pointer" style={{ touchAction: 'none' }}>
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              triggerLeftFlipper();
            }}
            className="w-1/2 h-full"
          />
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              triggerRightFlipper();
            }}
            className="w-1/2 h-full"
          />
        </div>
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-fuchsia-500/30 rounded-full text-[10px] text-fuchsia-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 좌/우 터치: 좌우 플리퍼 작동 (버튼 없음)' : 'Touch Left/Right Half: Flip Paddles (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_pinball_knights"
          gameTitle={isKo ? '3D 복셀 핀볼 나이츠: 범퍼 대전' : 'Voxel Pinball Knights: Bumper Duel'}
          customSteps={customTutorialSteps}
          language={language}
          onStartGame={() => setShowTutorial(false)}
          onClose={() => setShowTutorial(false)}
        />
      )}

      {/* Standardized Victory & Reward Settlement Modal */}
      {isGameOver && settlementReceipt && (
        <VictoryRewardModal
          receipt={settlementReceipt}
          language={language}
          onPlayAgain={handleRestart}
          onExit={onExit}
        />
      )}
    </div>
  );
};
export default VoxelPinballKnightsGame;
