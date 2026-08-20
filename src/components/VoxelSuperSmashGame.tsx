import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Swords, Shield, Zap, Sparkles, ArrowLeft, Trophy, Crosshair, Award } from 'lucide-react';
import { CardData } from '../types';

interface VoxelSuperSmashGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelSuperSmashGame: React.FC<VoxelSuperSmashGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [playerDamage, setPlayerDamage] = useState<number>(0);
  const [stocks, setStocks] = useState<number>(3);
  const [aliveEnemies, setAliveEnemies] = useState<number>(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const gameStateRef = useRef({
    posX: 0,
    posY: 1,
    posZ: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    rotY: 0,
    damage: 0,
    stocks: 3,
    aliveEnemies: 3,
    keys: { a: false, d: false, jump: false, smash: false },
    opponents: [] as {
      group: THREE.Group;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      damage: number;
      stocks: number;
      alive: boolean;
    }[],
    isGameOver: false,
    isVictory: false
  });

  const performSmashAttack = () => {
    const s = gameStateRef.current;
    if (s.isGameOver || s.isVictory) return;

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    s.opponents.forEach(op => {
      if (!op.alive) return;
      const dist = Math.hypot(op.x - s.posX, op.z - s.posZ);
      if (dist < 4.5) {
        op.damage += 25;
        const knockbackScale = (op.damage / 40) * 15;
        const angle = Math.atan2(op.x - s.posX, op.z - s.posZ);
        op.vx += Math.sin(angle) * knockbackScale;
        op.vy += knockbackScale * 0.8;
        op.vz += Math.cos(angle) * knockbackScale;
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      }
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0933);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 300);
    camera.position.set(0, 15, 24);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffeedd, 0.9);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(20, 50, 20);
    scene.add(dirLight);

    // Floating Arena Stage
    const stageGeo = new THREE.BoxGeometry(24, 2, 16);
    const stageMat = new THREE.MeshLambertMaterial({ color: 0x442266 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -1;
    scene.add(stage);

    // Player Hero Mesh
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), new THREE.MeshLambertMaterial({ color: 0x00aaff }));
    pBody.position.y = 0.8;
    playerGroup.add(pBody);
    scene.add(playerGroup);

    // Spawn 3 AI Brawlers
    const aiColors = [0xff2244, 0x22cc55, 0xffaa00];
    for (let i = 0; i < 3; i++) {
      const opGroup = new THREE.Group();
      const opBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.6, 0.8),
        new THREE.MeshLambertMaterial({ color: aiColors[i] })
      );
      opBody.position.y = 0.8;
      opGroup.add(opBody);
      const startX = (i - 1) * 6;
      opGroup.position.set(startX, 0, -2);
      scene.add(opGroup);

      gameStateRef.current.opponents.push({
        group: opGroup,
        x: startX,
        y: 0,
        z: -2,
        vx: 0,
        vy: 0,
        vz: 0,
        damage: 0,
        stocks: 2,
        alive: true
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = true;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = true;
      if (k === 'w' || k === 'arrowup' || k === ' ') {
        // Jump
        const s = gameStateRef.current;
        if (s.posY <= 1.2) {
          s.vy = 16;
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        }
      }
      if (k === 'j' || k === 'e') performSmashAttack();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') gameStateRef.current.keys.a = false;
      if (k === 'd' || k === 'arrowright') gameStateRef.current.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      const s = gameStateRef.current;

      if (!s.isGameOver && !s.isVictory) {
        // Player Horizontal Movement
        if (s.keys.a) s.vx = -14;
        else if (s.keys.d) s.vx = 14;
        else s.vx *= 0.85;

        // Player Gravity
        s.vy -= 35 * dt;
        s.posX += s.vx * dt;
        s.posY += s.vy * dt;

        // Platform collision
        if (Math.abs(s.posX) < 12 && Math.abs(s.posZ) < 8 && s.posY <= 0) {
          s.posY = 0;
          s.vy = 0;
        }

        // Ring-out check
        if (s.posY < -15 || Math.abs(s.posX) > 25 || Math.abs(s.posZ) > 20) {
          s.stocks -= 1;
          s.damage = 0;
          s.posX = 0;
          s.posY = 8;
          s.vx = 0;
          s.vy = 0;
          setStocks(s.stocks);
          setPlayerDamage(0);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

          if (s.stocks <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
          }
        }

        playerGroup.position.set(s.posX, s.posY, s.posZ);

        // AI Opponents Physics & AI
        let activeCount = 0;
        s.opponents.forEach(op => {
          if (!op.alive) return;
          activeCount += 1;

          // AI roam / attack toward player
          const dx = s.posX - op.x;
          op.vx += Math.sign(dx) * 8 * dt;
          op.vx = Math.max(-10, Math.min(10, op.vx));

          op.vy -= 35 * dt;
          op.x += op.vx * dt;
          op.y += op.vy * dt;
          op.z += op.vz * dt;

          if (Math.abs(op.x) < 12 && Math.abs(op.z) < 8 && op.y <= 0) {
            op.y = 0;
            op.vy = 0;
          }

          // AI Ring-out
          if (op.y < -15 || Math.abs(op.x) > 25 || Math.abs(op.z) > 20) {
            op.stocks -= 1;
            op.damage = 0;
            op.x = 0;
            op.y = 8;
            op.vx = 0;
            op.vy = 0;
            if (op.stocks <= 0) {
              op.alive = false;
              scene.remove(op.group);
            }
          }

          op.group.position.set(op.x, op.y, op.z);
        });

        setAliveEnemies(activeCount);
        if (activeCount === 0) {
          s.isVictory = true;
          setIsVictory(true);
          const reward = 60 + s.stocks * 10;
          setRewardSns(reward);
          onReward(reward);
        }
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
      window.removeEventListener('keyup', handleKeyUp);
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

        {/* Player Damage % & Stock Lives */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-slate-700">
          <div className="text-rose-400 font-mono font-black text-sm">
            누적 데미지: {playerDamage}%
          </div>

          <div className="text-yellow-400 text-xs font-bold">
            ❤️ 잔여 목숨: {stocks}
          </div>

          <div className="bg-purple-950 border border-purple-500/40 px-2 py-0.5 rounded text-purple-300 text-xs font-bold">
            생존 적: {aliveEnemies}
          </div>
        </div>
      </div>

      {/* Mobile Touch Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button
            onPointerDown={() => (gameStateRef.current.keys.a = true)}
            onPointerUp={() => (gameStateRef.current.keys.a = false)}
            className="w-16 h-16 bg-slate-800/90 text-white rounded-2xl border border-slate-600 font-bold text-lg flex items-center justify-center cursor-pointer active:scale-95"
          >
            ◀
          </button>
          <button
            onPointerDown={() => (gameStateRef.current.keys.d = true)}
            onPointerUp={() => (gameStateRef.current.keys.d = false)}
            className="w-16 h-16 bg-slate-800/90 text-white rounded-2xl border border-slate-600 font-bold text-lg flex items-center justify-center cursor-pointer active:scale-95"
          >
            ▶
          </button>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={() => {
              const s = gameStateRef.current;
              if (s.posY <= 1.2) {
                s.vy = 16;
                playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              }
            }}
            className="w-16 h-16 bg-sky-600/90 text-white rounded-2xl border-2 border-sky-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95"
          >
            <span>점프</span>
          </button>

          <button
            onClick={performSmashAttack}
            className="w-16 h-16 bg-rose-600/90 text-white rounded-2xl border-2 border-rose-400 font-bold text-xs flex flex-col items-center justify-center cursor-pointer active:scale-95 shadow-xl"
          >
            <Swords size={22} />
            <span>스매시 [Space]</span>
          </button>
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {(isVictory || isGameOver) && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isVictory ? 'bg-amber-400/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isVictory ? <Trophy size={36} /> : <Award size={36} />}
            </div>

            <h2 className="text-2xl font-black italic uppercase">{isVictory ? '스매시 챔피언 VICTORY' : '장외 넉아웃! DEFEAT'}</h2>

            <p className="text-xs text-slate-300">
              {isVictory
                ? '모든 라이벌 영웅들을 장외로 날려버리고 최종 승리를 차지했습니다!'
                : '장외로 날아가 모든 목숨을 소진했습니다.'}
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
