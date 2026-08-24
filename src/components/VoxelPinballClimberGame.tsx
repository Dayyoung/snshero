import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CardData } from '../types';
import { MinimalistMissionHUD } from './MinimalistMissionHUD';
import { UniversalTutorialModal, TutorialStep } from './UniversalTutorialModal';
import { VictoryRewardModal } from './VictoryRewardModal';
import { calculateAndDepositMissionReward, RewardReceipt } from '../lib/standardizedRewardGateway';

interface VoxelPinballClimberGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

interface Bumper {
  mesh: THREE.Mesh;
  radius: number;
  points: number;
}

export const VoxelPinballClimberGame: React.FC<VoxelPinballClimberGameProps> = ({
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
      return localStorage.getItem('hero_tutorial_game_voxel_pinball_climber') !== 'true';
    } catch {
      return true;
    }
  });
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [currentFloor, setCurrentFloor] = useState<number>(1);
  const targetFloor = 5;
  const [combo, setCombo] = useState<number>(0);
  const [ballsLeft, setBallsLeft] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [settlementReceipt, setSettlementReceipt] = useState<RewardReceipt | null>(null);

  const stateRef = useRef({
    ballPos: new THREE.Vector3(0, 2, 0),
    ballVel: new THREE.Vector3(0, 0, 0),
    ballMesh: null as THREE.Mesh | null,
    leftFlipPressed: false,
    rightFlipPressed: false,
    leftFlipAngle: 0,
    rightFlipAngle: 0,
    leftFlipper: null as THREE.Mesh | null,
    rightFlipper: null as THREE.Mesh | null,
    currentFloor: 1,
    score: 0,
    combo: 0,
    ballsLeft: 3,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    startTime: Date.now(),
    bumpers: [] as Bumper[],
    scene: null as THREE.Scene | null
  });

  const launchBall = () => {
    const s = stateRef.current;
    if (s.isGameOver || s.isVictory || s.isPaused) return;
    s.ballVel.set((Math.random() - 0.5) * 4, 18, 0);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    stateRef.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 150);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xf43f5e, 1.4);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Pinball Backboard
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(16, 32, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    board.position.set(0, 12, -0.4);
    scene.add(board);

    // Ball
    const bGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const bMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 });
    const ball = new THREE.Mesh(bGeo, bMat);
    ball.position.set(0, 4, 0);
    scene.add(ball);
    stateRef.current.ballMesh = ball;

    // Flippers
    const fGeo = new THREE.BoxGeometry(2.4, 0.4, 0.4);
    const fMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });

    const lFlip = new THREE.Mesh(fGeo, fMat);
    lFlip.position.set(-2.0, 1.5, 0);
    scene.add(lFlip);
    stateRef.current.leftFlipper = lFlip;

    const rFlip = new THREE.Mesh(fGeo, fMat);
    rFlip.position.set(2.0, 1.5, 0);
    scene.add(rFlip);
    stateRef.current.rightFlipper = rFlip;

    // Spawn Bumpers
    stateRef.current.bumpers = [];
    const bmpGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
    const bmpMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0x9f1239 });

    for (let f = 1; f <= targetFloor; f++) {
      [-3, 0, 3].forEach(bx => {
        const bmp = new THREE.Mesh(bmpGeo, bmpMat);
        bmp.rotation.x = Math.PI / 2;
        bmp.position.set(bx, f * 5 + 3, 0);
        scene.add(bmp);

        stateRef.current.bumpers.push({
          mesh: bmp,
          radius: 0.9,
          points: 150 * f
        });
      });
    }

    launchBall();

    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const s = stateRef.current;
      if (s.isPaused || s.isGameOver) return;

      // Ball Physics
      s.ballVel.y -= 18 * dt; // Gravity
      s.ballPos.x += s.ballVel.x * dt;
      s.ballPos.y += s.ballVel.y * dt;

      // Wall bounce
      if (s.ballPos.x < -7) {
        s.ballPos.x = -7;
        s.ballVel.x *= -0.8;
      } else if (s.ballPos.x > 7) {
        s.ballPos.x = 7;
        s.ballVel.x *= -0.8;
      }

      // Ceiling bounce
      if (s.ballPos.y > 28) {
        s.ballPos.y = 28;
        s.ballVel.y *= -0.8;
      }

      // Bumper Hit Check
      s.bumpers.forEach(b => {
        const dist = s.ballPos.distanceTo(b.mesh.position);
        if (dist < b.radius + 0.5) {
          const hitDir = new THREE.Vector3().subVectors(s.ballPos, b.mesh.position).normalize();
          s.ballVel.copy(hitDir.multiplyScalar(22));
          s.score += b.points;
          s.combo += 1;
          s.currentFloor = Math.min(targetFloor, Math.max(1, Math.floor(s.ballPos.y / 5)));

          setScore(s.score);
          setCombo(s.combo);
          setCurrentFloor(s.currentFloor);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.currentFloor >= targetFloor && !s.isGameOver) {
            s.isVictory = true;
            s.isGameOver = true;
            setIsGameOver(true);
            const duration = (Date.now() - s.startTime) / 1000;
            const receipt = calculateAndDepositMissionReward({
              gameId: 'voxel_pinball_climber',
              gameTitle: '복셀 핀볼 클라이머',
              durationSeconds: duration,
              score: s.score + 2000,
              difficulty: 'HARD',
              isVictory: true
            });
            setSettlementReceipt(receipt);
            onReward(receipt.totalSns);
          }
        }
      });

      // Flipper bounce
      if (s.leftFlipPressed && s.ballPos.y < 2.5 && s.ballPos.x < 0 && s.ballPos.x > -4) {
        s.ballVel.set(4, 20, 0);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      }
      if (s.rightFlipPressed && s.ballPos.y < 2.5 && s.ballPos.x > 0 && s.ballPos.x < 4) {
        s.ballVel.set(-4, 20, 0);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      }

      // Ball Drain Check
      if (s.ballPos.y < 0) {
        s.ballsLeft -= 1;
        setBallsLeft(s.ballsLeft);
        s.combo = 0;
        setCombo(0);

        if (s.ballsLeft > 0) {
          s.ballPos.set(0, 4, 0);
          launchBall();
        } else if (!s.isGameOver) {
          s.isGameOver = true;
          setIsGameOver(true);
          const duration = (Date.now() - s.startTime) / 1000;
          const receipt = calculateAndDepositMissionReward({
            gameId: 'voxel_pinball_climber',
            gameTitle: '복셀 핀볼 클라이머',
            durationSeconds: duration,
            score: s.score,
            difficulty: 'HARD',
            isVictory: false
          });
          setSettlementReceipt(receipt);
          onReward(receipt.totalSns);
        }
      }

      if (ball) {
        ball.position.copy(s.ballPos);
      }

      // Camera Y follow
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, s.ballPos.y + 6, dt * 5);
      camera.lookAt(0, camera.position.y - 2, 0);

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
    const s = stateRef.current;
    s.ballPos.set(0, 4, 0);
    s.ballVel.set(0, 0, 0);
    s.score = 0;
    s.combo = 0;
    s.currentFloor = 1;
    s.ballsLeft = 3;
    s.isGameOver = false;
    s.isVictory = false;
    s.startTime = Date.now();
    setScore(0);
    setCombo(0);
    setCurrentFloor(1);
    setBallsLeft(3);
    setIsGameOver(false);
    setSettlementReceipt(null);
    launchBall();
  };

  const customTutorialSteps: TutorialStep[] = [
    {
      badge: isKo ? 'STEP 1: 핀볼 타워 등반' : 'STEP 1: PINBALL CLIMB',
      title: isKo ? '5층 범퍼 정상 정복' : 'Reach Floor 5 Summit',
      description: isKo
        ? '좌우 플리퍼로 볼을 힘차게 튕겨 상층부 범퍼를 타격하며 5층 타워 꼭대기에 도달하세요.'
        : 'Flip paddles to bounce the pinball upwards across bumper floors and conquer 5F summit.',
      keyPoints: isKo
        ? [
            '5층 정상 도달 시 클리어 완승',
            '범퍼 타격마다 콤보 보너스 폭발',
            '볼 잔여 3개 내에 완주'
          ]
        : [
            'Climb to 5F summit to win',
            'Chain bumper combos for high score',
            'Clear within 3 available balls'
          ],
      iconType: 'GOAL'
    },
    {
      badge: isKo ? 'STEP 2: 퓨어 제스처 컨트롤' : 'STEP 2: PURE GESTURES',
      title: isKo ? '좌/우 화면 분할 플리퍼 조작' : 'Left/Right Half Touch Controls',
      description: isKo
        ? '화면 왼쪽을 누르면 좌측 플리퍼, 오른쪽을 누르면 우측 플리퍼가 작동합니다.'
        : 'Touch left screen half for left flipper, right half for right flipper with zero buttons.',
      keyPoints: isKo
        ? [
            '👆 화면 좌측 터치: 좌측 플리퍼 튕기기',
            '👆 화면 우측 터치: 우측 플리퍼 튕기기',
            '⚡ 양쪽 동시 터치: 파워 리바운드'
          ]
        : [
            '👆 Touch Left: Left paddle flip',
            '👆 Touch Right: Right paddle flip',
            '⚡ Dual touch: Power rebound'
          ],
      iconType: 'GESTURES'
    },
    {
      badge: isKo ? 'STEP 3: 100% 확정 SNS 보상' : 'STEP 3: GUARANTEED REWARDS',
      title: isKo ? '원자적 지갑 입금 & 정산' : 'Atomic Wallet Settlement',
      description: isKo
        ? '정상 정복 즉시 HARD 난이도 표준 정산이 적용되어 지갑에 즉시 입금됩니다.'
        : 'Standard payout scaled with Hard multiplier deposited atomically to your wallet.',
      keyPoints: isKo
        ? [
            '승리 즉시 LocalStorage 영구 지갑 입금',
            '최고 층수 및 콤보 팡파레 보너스',
            'VictoryRewardModal 2초 황금 코인 팡파레'
          ]
        : [
            'Instant atomic deposit to LocalStorage wallet',
            'Highest floor and combo bonuses',
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
        title={isKo ? '복셀 핀볼 클라이머' : 'Voxel Pinball Climber'}
        language={language}
        telemetries={[
          { label: isKo ? '층수' : 'Floor', value: `${currentFloor}F/${targetFloor}F`, color: 'text-amber-300' },
          { label: isKo ? '볼' : 'Balls', value: `x${ballsLeft}`, color: ballsLeft <= 1 ? 'text-rose-400 font-bold' : 'text-cyan-300' },
          { label: isKo ? '콤보' : 'Combo', value: `x${combo}`, color: combo > 1 ? 'text-emerald-400 font-bold' : 'text-slate-400' },
          { label: isKo ? '점수' : 'Score', value: `${score}P`, color: 'text-yellow-300' }
        ]}
        onExit={onExit}
        onHelp={() => setShowTutorial(true)}
        onPauseToggle={() => {
          setIsPaused(prev => !prev);
          stateRef.current.isPaused = !isPaused;
        }}
        isPaused={isPaused}
      />

      {/* Screen Gesture Touch Overlay (Left / Right Halves) */}
      {!isGameOver && !isPaused && !showTutorial && (
        <div className="absolute inset-0 z-10 flex select-none touch-none cursor-pointer" style={{ touchAction: 'none' }}>
          <div
            className="w-1/2 h-full"
            onPointerDown={() => { stateRef.current.leftFlipPressed = true; }}
            onPointerUp={() => { stateRef.current.leftFlipPressed = false; }}
            onPointerLeave={() => { stateRef.current.leftFlipPressed = false; }}
          />
          <div
            className="w-1/2 h-full"
            onPointerDown={() => { stateRef.current.rightFlipPressed = true; }}
            onPointerUp={() => { stateRef.current.rightFlipPressed = false; }}
            onPointerLeave={() => { stateRef.current.rightFlipPressed = false; }}
          />
        </div>
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/75 border border-amber-500/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {isKo ? '화면 좌/우 터치: 좌우 플리퍼 튕기기 (버튼 없음)' : 'Touch Left/Right Half: Flip Paddles (No Buttons)'}
        </div>
      </div>

      {/* Universal 3-Step Interactive Tutorial Modal */}
      {showTutorial && (
        <UniversalTutorialModal
          gameId="voxel_pinball_climber"
          gameTitle={isKo ? '3D 복셀 핀볼 클라이머: 범퍼 타워' : 'Voxel Pinball Climber: Bumper Tower'}
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
