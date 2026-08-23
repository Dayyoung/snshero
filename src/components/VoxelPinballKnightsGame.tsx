import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Award } from 'lucide-react';
import { CardData } from '../types';

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
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState<number>(0);
  const [balls, setBalls] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    ballX: 0,
    ballZ: 5,
    ballVx: 0,
    ballVz: -18,
    score: 0,
    balls: 3,
    leftFlipperUp: false,
    rightFlipperUp: false,
    bumpers: [] as { mesh: THREE.Mesh; x: number; z: number }[],
    isGameOver: false,
    isVictory: false
  });

  const triggerLeftFlipper = () => {
    const s = gameStateRef.current;
    s.leftFlipperUp = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setTimeout(() => {
      s.leftFlipperUp = false;
    }, 150);

    if (Math.abs(s.ballZ - 10) < 2.5 && s.ballX < 0 && s.ballX > -6) {
      s.ballVz = -30 - Math.random() * 10;
      s.ballVx = 10 + Math.random() * 10;
    }
  };

  const triggerRightFlipper = () => {
    const s = gameStateRef.current;
    s.rightFlipperUp = true;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setTimeout(() => {
      s.rightFlipperUp = false;
    }, 150);

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
    const tableGeo = new THREE.BoxGeometry(16, 1, 26);
    const tableMat = new THREE.MeshLambertMaterial({ color: 0x221133 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.5;
    scene.add(table);

    // Pinball Ball
    const ballGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const ballMat = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 100 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(0, 0.8, 5);
    scene.add(ballMesh);

    // Bumpers
    const bumperGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.0, 16);
    const bumperMat = new THREE.MeshPhongMaterial({ color: 0xff0077, emissive: 0x440022 });
    const bumperPositions = [
      { x: -3, z: -6 },
      { x: 3, z: -6 },
      { x: 0, z: -10 }
    ];

    bumperPositions.forEach(p => {
      const bMesh = new THREE.Mesh(bumperGeo, bumperMat);
      bMesh.position.set(p.x, 0.5, p.z);
      scene.add(bMesh);
      gameStateRef.current.bumpers.push({ mesh: bMesh, x: p.x, z: p.z });
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') triggerLeftFlipper();
      if (k === 'd' || k === 'arrowright') triggerRightFlipper();
    };

    window.addEventListener('keydown', handleKeyDown);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        s.ballVz += 12 * dt; // table slope gravity
        s.ballX += s.ballVx * dt;
        s.ballZ += s.ballVz * dt;

        // Wall collisions
        if (s.ballX < -7) {
          s.ballX = -7;
          s.ballVx = Math.abs(s.ballVx);
        }
        if (s.ballX > 7) {
          s.ballX = 7;
          s.ballVx = -Math.abs(s.ballVx);
        }
        if (s.ballZ < -12) {
          s.ballZ = -12;
          s.ballVz = Math.abs(s.ballVz);
        }

        // Bumper hit check
        s.bumpers.forEach(b => {
          const dist = Math.hypot(s.ballX - b.x, s.ballZ - b.z);
          if (dist < 2.0) {
            const angle = Math.atan2(s.ballX - b.x, s.ballZ - b.z);
            s.ballVx = Math.sin(angle) * 28;
            s.ballVz = Math.cos(angle) * 28;
            s.score += 500;
            setScore(s.score);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

            if (s.score >= 5000) {
              s.isVictory = true;
              setIsVictory(true);
              const reward = 55 + Math.floor(s.score / 500);
              setRewardSns(reward);
              onReward(reward);
            }
          }
        });

        // Drain bottom
        if (s.ballZ > 14) {
          s.balls -= 1;
          s.ballX = 0;
          s.ballZ = 5;
          s.ballVx = 0;
          s.ballVz = -20;
          setBalls(s.balls);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.balls <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
          }
        }

        ballMesh.position.set(s.ballX, 0.8, s.ballZ);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode, onReward, playSfx]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 text-white select-none overflow-hidden flex flex-col font-sans">
      <div ref={mountRef} className="w-full h-full absolute inset-0" />

      {/* Top HUD */}
      <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
        <button
          onClick={onExit}
          className="pointer-events-auto p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="text-xs font-bold">{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Score & Balls */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="text-yellow-400 font-black font-mono text-sm">
            🏆 SCORE: {score}/5000
          </div>

          <div className="text-pink-400 font-bold text-xs">
            ⚪ 남은 볼: {balls}
          </div>
        </div>
      </div>

      {/* Screen Touch Flipper Overlay (Left / Right Half Screen) */}
      {!isGameOver && !isVictory && (
        <div className="absolute inset-0 z-20 flex select-none touch-none" style={{ touchAction: 'none' }}>
          {/* Left Flipper Area */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              triggerLeftFlipper();
            }}
            className="w-1/2 h-full cursor-pointer"
          />

          {/* Right Flipper Area */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              triggerRightFlipper();
            }}
            className="w-1/2 h-full cursor-pointer"
          />
        </div>
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-slate-900/80 border border-fuchsia-400/30 rounded-full text-[10px] text-fuchsia-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '화면 좌/우 터치: 좌우 플리퍼 작동 (버튼 없음)' : 'Touch Left/Right Half: Flip Paddles (No Buttons)'}
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '핀볼 나이츠 대승리! VICTORY' : '볼 소진! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '화려한 콤보와 범퍼 타격으로 핀볼 챔피언에 등극했습니다!'
                : '모든 볼을 소진하였습니다.'}
            </p>

            {isVictory && (
              <div className="bg-slate-950 border border-amber-500/30 p-3 rounded-2xl">
                <span className="text-xs text-slate-400 block uppercase font-bold">REWARD</span>
                <span className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1">
                  <Sparkles size={20} /> +{rewardSns} SNS
                </span>
              </div>
            )}

            <button
              onClick={onExit}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              {language === 'ko' ? '확인 및 나가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
