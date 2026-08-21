import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Sparkles, Zap, Flame, Shield, Swords } from 'lucide-react';
import { CardData } from '../types';

interface VoxelDojoBalanceGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDojoBalanceGame: React.FC<VoxelDojoBalanceGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [balance, setBalance] = useState<number>(50); // 0 (left fall) ~ 100 (right fall), 50 is perfect
  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [opponentName, setOpponentName] = useState<string>('Shadow Shinobi');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    balance: 50,
    balanceDrift: 0,
    playerHp: 100,
    enemyHp: 100,
    enemyAttackTimer: 1.5,
    isPlayerAttacking: false,
    isPlayerGuarding: false,
    isEnemyAttacking: false,
    score: 0,
    streak: 0,
    isGameOver: false,
    playerGroup: null as THREE.Group | null,
    playerStaff: null as THREE.Mesh | null,
    enemyGroup: null as THREE.Group | null,
    enemyStaff: null as THREE.Mesh | null
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 7.5);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Warm Sunset Light
    const ambientLight = new THREE.AmbientLight(0xfef08a, 0.8);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xf97316, 2.2);
    sun.position.set(5, 12, 6);
    sun.castShadow = !lowSpecMode;
    scene.add(sun);

    // Waterfall / Mist Pool Below
    const waterGeo = new THREE.PlaneGeometry(30, 30);
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -3, 0);
    scene.add(water);

    // High Narrow Wooden Log (The Bridge)
    const logGeo = new THREE.CylinderGeometry(0.5, 0.5, 12, 16);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const log = new THREE.Mesh(logGeo, logMat);
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 0, 0);
    log.receiveShadow = !lowSpecMode;
    scene.add(log);

    // Player Ninja (Left side of the log)
    const playerGroup = new THREE.Group();
    const pBodyGeo = new THREE.BoxGeometry(0.7, 1.3, 0.6);
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const pBody = new THREE.Mesh(pBodyGeo, pBodyMat);
    pBody.position.y = 1.0;
    playerGroup.add(pBody);

    // Player Bo Staff
    const staffGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
    const playerStaff = new THREE.Mesh(staffGeo, staffMat);
    playerStaff.position.set(0.4, 1.1, 0.5);
    playerStaff.rotation.x = Math.PI / 3;
    playerGroup.add(playerStaff);

    playerGroup.position.set(-1.8, 0.4, 0);
    scene.add(playerGroup);
    stateRef.current.playerGroup = playerGroup;
    stateRef.current.playerStaff = playerStaff;

    // Enemy Ninja (Right side of the log)
    const enemyGroup = new THREE.Group();
    const eBodyGeo = new THREE.BoxGeometry(0.7, 1.3, 0.6);
    const eBodyMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c });
    const eBody = new THREE.Mesh(eBodyGeo, eBodyMat);
    eBody.position.y = 1.0;
    enemyGroup.add(eBody);

    // Enemy Bo Staff
    const enemyStaff = new THREE.Mesh(staffGeo, staffMat);
    enemyStaff.position.set(-0.4, 1.1, 0.5);
    enemyStaff.rotation.x = Math.PI / 3;
    enemyGroup.add(enemyStaff);

    enemyGroup.position.set(1.8, 0.4, 0);
    scene.add(enemyGroup);
    stateRef.current.enemyGroup = enemyGroup;
    stateRef.current.enemyStaff = enemyStaff;

    let animId: number;
    let lastTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const state = stateRef.current;
      if (state.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Natural Wind / Balance Drift
      state.balanceDrift += (Math.random() - 0.5) * 12 * dt;
      state.balance += state.balanceDrift * dt;
      state.balance = Math.max(0, Math.min(100, state.balance));
      setBalance(Math.round(state.balance));

      // Tilt Player Mesh based on balance
      if (state.playerGroup) {
        const tiltAngle = ((state.balance - 50) / 50) * 0.45;
        state.playerGroup.rotation.z = -tiltAngle;
      }

      // Check Fall Game Over
      if (state.balance <= 2 || state.balance >= 98) {
        state.isGameOver = true;
        setIsGameOver(true);
        const reward = Math.min(260, Math.floor(state.score / 40) + state.streak * 20);
        setRewardSns(reward);
        onReward(reward);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }

      // Enemy Attack AI Loop
      state.enemyAttackTimer -= dt;
      if (state.enemyAttackTimer <= 0) {
        state.enemyAttackTimer = 1.6 + Math.random() * 1.2;
        state.isEnemyAttacking = true;

        if (state.enemyStaff) {
          state.enemyStaff.rotation.z = -Math.PI / 2;
        }

        setTimeout(() => {
          if (state.isGameOver) return;
          if (state.isPlayerGuarding) {
            // Guard successful! Push enemy back
            state.balanceDrift *= 0.5;
            state.score += 150;
            setScore(state.score);
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
          } else {
            // Player hit! Lose balance
            const force = (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 10);
            state.balance += force;
            state.balanceDrift += force * 0.5;
            if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          }
          if (state.enemyStaff) state.enemyStaff.rotation.z = 0;
          state.isEnemyAttacking = false;
        }, 300);
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
  }, [lowSpecMode, onReward, playSfx]);

  const handlePlayerAttack = (heavy: boolean = false) => {
    const state = stateRef.current;
    if (state.isGameOver || state.isPlayerAttacking) return;

    state.isPlayerAttacking = true;
    if (state.playerStaff) {
      state.playerStaff.rotation.z = Math.PI / 2;
    }

    const dmg = heavy ? 45 : 25;
    const recoil = (Math.random() - 0.5) * (heavy ? 12 : 5);
    state.balance += recoil;

    setTimeout(() => {
      state.enemyHp -= dmg;
      if (state.enemyHp <= 0) {
        // Enemy Knocked Off!
        state.streak++;
        state.score += 500 + state.streak * 200;
        setScore(state.score);
        setStreak(state.streak);
        state.enemyHp = 100;
        state.balance = 50;
        state.balanceDrift = 0;
        setEnemyHp(100);
        setOpponentName(`Shadow Shinobi #${state.streak + 1}`);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      } else {
        setEnemyHp(state.enemyHp);
        if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
      }

      if (state.playerStaff) state.playerStaff.rotation.z = 0;
      state.isPlayerAttacking = false;
    }, 250);
  };

  const handleBalanceAdjust = (dir: number) => {
    const state = stateRef.current;
    state.balance += dir * 6;
    state.balanceDrift = 0;
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-zinc-950 flex flex-col items-center select-none overflow-hidden font-mono">
      {/* 3D Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Header HUD */}
      <div className="relative z-10 w-full max-w-xl p-3 flex items-center justify-between pointer-events-auto bg-zinc-900/85 backdrop-blur-sm border-b border-amber-600/40">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-400 text-xs font-bold rounded-sm border border-amber-600/40"
        >
          <ArrowLeft size={14} />
          <span>{isKo ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy size={14} />
            <span>{score.toLocaleString()}P</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400">
            <Swords size={14} />
            <span>{streak} KO</span>
          </div>
        </div>
      </div>

      {/* Center Balance Meter */}
      <div className="relative z-10 mt-3 w-full max-w-xs px-4 flex flex-col items-center pointer-events-none gap-1 bg-zinc-950/80 p-2 border border-zinc-800 rounded-sm">
        <div className="w-full flex justify-between text-[10px] font-bold text-amber-400">
          <span>◀ LEFT</span>
          <span>BALANCE</span>
          <span>RIGHT ▶</span>
        </div>
        <div className="w-full h-3 bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700 relative">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-emerald-500 z-10" />
          <div
            className="absolute top-0 bottom-0 w-4 bg-amber-400 -translate-x-1/2 transition-all duration-75"
            style={{ left: `${balance}%` }}
          />
        </div>
      </div>

      {/* Enemy Health Bar */}
      <div className="relative z-10 mt-2 w-full max-w-xs px-4 flex flex-col items-center pointer-events-none gap-1">
        <div className="w-full flex justify-between text-[11px] font-bold text-rose-400">
          <span>{opponentName}</span>
          <span>{enemyHp} HP</span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-sm overflow-hidden border border-zinc-700">
          <div className="h-full bg-rose-500 transition-all duration-150" style={{ width: `${enemyHp}%` }} />
        </div>
      </div>

      {/* Mobile Touch Action Controls */}
      {!isGameOver && (
        <div className="absolute inset-x-0 bottom-6 z-20 flex justify-between px-6 pointer-events-none">
          {/* Left / Right Balance Recovery Buttons */}
          <div className="flex gap-3 pointer-events-auto">
            <button
              onPointerDown={() => handleBalanceAdjust(-1)}
              className="w-14 h-14 bg-zinc-900/90 border-2 border-cyan-400 active:bg-cyan-500/20 text-cyan-400 text-sm font-black rounded-sm flex flex-col items-center justify-center shadow-lg"
            >
              <span>◀ LEAN</span>
            </button>
            <button
              onPointerDown={() => handleBalanceAdjust(1)}
              className="w-14 h-14 bg-zinc-900/90 border-2 border-cyan-400 active:bg-cyan-500/20 text-cyan-400 text-sm font-black rounded-sm flex flex-col items-center justify-center shadow-lg"
            >
              <span>LEAN ▶</span>
            </button>
          </div>

          {/* Attack / Heavy / Guard Buttons */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onPointerDown={() => {
                stateRef.current.isPlayerGuarding = true;
              }}
              onPointerUp={() => {
                stateRef.current.isPlayerGuarding = false;
              }}
              className="w-14 h-14 bg-zinc-900/90 border-2 border-emerald-400 active:bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-sm flex flex-col items-center justify-center shadow-lg"
            >
              <Shield size={16} />
              <span>GUARD</span>
            </button>

            <button
              onPointerDown={() => handlePlayerAttack(false)}
              className="w-14 h-14 bg-amber-600 active:bg-amber-500 text-zinc-950 text-xs font-black rounded-sm flex flex-col items-center justify-center shadow-lg"
            >
              <Swords size={16} />
              <span>STRIKE</span>
            </button>

            <button
              onPointerDown={() => handlePlayerAttack(true)}
              className="w-14 h-14 bg-rose-600 active:bg-rose-500 text-white text-xs font-black rounded-sm flex flex-col items-center justify-center shadow-lg"
            >
              <Flame size={16} />
              <span>HEAVY</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-zinc-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-zinc-900 border-2 border-amber-500 p-6 flex flex-col items-center gap-4 text-center rounded-none shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            <Trophy size={40} className="text-amber-400 animate-bounce" />
            <h2 className="text-lg font-black text-white tracking-widest">
              {isKo ? '외나무다리 대결 종료!' : 'DOJO DUEL ENDED!'}
            </h2>
            <div className="w-full bg-zinc-950 p-3 border border-zinc-800 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>{isKo ? '격파한 닌자 수' : 'Defeated Ninjas'}</span>
                <span className="text-rose-400 font-bold">{streak} KO</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>{isKo ? '최종 획득 점수' : 'Final Score'}</span>
                <span className="text-amber-400 font-bold">{score.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-zinc-400 border-t border-zinc-800 pt-1.5">
                <span>{isKo ? 'SNS 보상 포인트' : 'SNS Reward'}</span>
                <span className="text-emerald-400 font-bold">+{rewardSns} SNS</span>
              </div>
            </div>

            <button
              onClick={onExit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-98 text-zinc-950 font-black text-sm rounded-sm tracking-wider shadow-lg"
            >
              {isKo ? '확인 및 보상 수령' : 'Confirm & Claim'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
