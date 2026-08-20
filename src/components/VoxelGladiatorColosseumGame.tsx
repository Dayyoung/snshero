import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Shield, Swords, Sparkles, RefreshCw } from 'lucide-react';
import { CardData } from '../types';

interface VoxelGladiatorColosseumGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelGladiatorColosseumGame: React.FC<VoxelGladiatorColosseumGameProps> = ({
  deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeHeroIdx, setActiveHeroIdx] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [enemyHp, setEnemyHp] = useState<number>(150);
  const [crowdFever, setCrowdFever] = useState<number>(0);
  const [isGuarding, setIsGuarding] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const heroCards = deck.slice(0, 3);
  const currentHero = heroCards[activeHeroIdx] || { title: 'Gladiator', power: 15 };

  const stateRef = useRef({
    playerHp: 100,
    enemyHp: 150,
    crowdFever: 0,
    isGuarding: false,
    parryWindow: 0,
    isAttacking: false,
    attackTime: 0,
    enemyAttackCooldown: 60,
    enemyIsAttacking: false,
    heroIdx: 0,
    isGameOver: false,
    isVictory: false
  });

  const triggerAttack = () => {
    const s = stateRef.current;
    if (s.isAttacking || s.isGameOver) return;
    s.isAttacking = true;
    s.attackTime = 15;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    // Check hit on enemy
    const dmg = (currentHero.power || 15) * (s.crowdFever >= 100 ? 2 : 1);
    s.enemyHp = Math.max(0, s.enemyHp - dmg);
    s.crowdFever = Math.min(100, s.crowdFever + 12);
    setEnemyHp(s.enemyHp);
    setCrowdFever(s.crowdFever);

    if (s.enemyHp <= 0) {
      s.isGameOver = true;
      s.isVictory = true;
      setIsGameOver(true);
      setIsVictory(true);
      const reward = 250;
      setRewardSns(reward);
      onReward(reward);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    }
  };

  const startGuard = () => {
    const s = stateRef.current;
    s.isGuarding = true;
    s.parryWindow = 12; // 0.2s parry window
    setIsGuarding(true);
  };

  const stopGuard = () => {
    const s = stateRef.current;
    s.isGuarding = false;
    setIsGuarding(false);
  };

  const tagNextHero = () => {
    const s = stateRef.current;
    if (heroCards.length <= 1) return;
    const nextIdx = (s.heroIdx + 1) % heroCards.length;
    s.heroIdx = nextIdx;
    setActiveHeroIdx(nextIdx);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0f0a);
    scene.fog = new THREE.FogExp2(0x1a0f0a, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffeedd, 0.7);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffa500, 1.5);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Colosseum Sand Arena
    const floorGeo = new THREE.CylinderGeometry(18, 18, 1, 32);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x8a6240 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.5;
    scene.add(floor);

    // Arena Pillars
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 8), new THREE.MeshLambertMaterial({ color: 0x5a4230 }));
      pillar.position.set(Math.cos(angle) * 16, 4, Math.sin(angle) * 16);
      scene.add(pillar);
    }

    // Player Gladiator Mesh
    const playerGroup = new THREE.Group();
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.0), new THREE.MeshLambertMaterial({ color: 0x00f5d4 }));
    pBody.position.y = 0.9;
    playerGroup.add(pBody);

    const pSword = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 0.4), new THREE.MeshLambertMaterial({ color: 0xffe600 }));
    pSword.position.set(0.9, 0.9, 0.5);
    playerGroup.add(pSword);

    const pShield = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 1.2), new THREE.MeshLambertMaterial({ color: 0x00bbf9 }));
    pShield.position.set(-0.9, 0.9, 0.3);
    playerGroup.add(pShield);

    playerGroup.position.set(0, 0, 3);
    scene.add(playerGroup);

    // Enemy Gladiator Boss Mesh
    const enemyGroup = new THREE.Group();
    const eBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 1.4), new THREE.MeshLambertMaterial({ color: 0xef233c }));
    eBody.position.y = 1.2;
    enemyGroup.add(eBody);

    const eAxe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.8), new THREE.MeshLambertMaterial({ color: 0x2b2d42 }));
    eAxe.position.set(1.2, 1.4, 0.6);
    enemyGroup.add(eAxe);

    enemyGroup.position.set(0, 0, -3);
    scene.add(enemyGroup);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      if (s.parryWindow > 0) s.parryWindow -= 1;

      // Player Attack Animation
      if (s.isAttacking) {
        s.attackTime -= 1;
        pSword.rotation.x = -Math.sin((15 - s.attackTime) / 15 * Math.PI) * 1.5;
        if (s.attackTime <= 0) {
          s.isAttacking = false;
          pSword.rotation.x = 0;
        }
      }

      // Player Guard Pose
      if (s.isGuarding) {
        pShield.position.set(0, 0.9, 0.9);
      } else {
        pShield.position.set(-0.9, 0.9, 0.3);
      }

      // Enemy AI Attack Logic
      s.enemyAttackCooldown -= 1;
      if (s.enemyAttackCooldown <= 0) {
        s.enemyAttackCooldown = 75;
        eAxe.rotation.x = -1.2;
        setTimeout(() => { eAxe.rotation.x = 0; }, 300);

        if (s.isGuarding) {
          if (s.parryWindow > 0) {
            // Perfect Parry!
            s.crowdFever = 100;
            setCrowdFever(100);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          } else {
            // Blocked partial
            s.playerHp = Math.max(0, s.playerHp - 4);
            setPlayerHp(s.playerHp);
          }
        } else {
          // Direct Hit
          s.playerHp = Math.max(0, s.playerHp - 20);
          setPlayerHp(s.playerHp);
          if (s.playerHp <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
            const reward = 50;
            setRewardSns(reward);
            onReward(reward);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix;
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [lowSpecMode]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col font-mono select-none overflow-hidden">
      {/* Header HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white text-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-sm border border-slate-700 font-bold"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* HP Bars */}
        <div className="flex items-center gap-4 text-xs font-black">
          <div className="flex flex-col items-end">
            <span className="text-cyan-400 font-bold">HERO HP: {playerHp}/100</span>
            <div className="w-24 bg-slate-950 border border-cyan-500/40 h-2.5 rounded-xs overflow-hidden">
              <div className="bg-cyan-400 h-full transition-all" style={{ width: `${playerHp}%` }} />
            </div>
          </div>
          <span className="text-slate-500 font-black">VS</span>
          <div className="flex flex-col items-start">
            <span className="text-rose-400 font-bold">BOSS HP: {enemyHp}/150</span>
            <div className="w-24 bg-slate-950 border border-rose-500/40 h-2.5 rounded-xs overflow-hidden">
              <div className="bg-rose-500 h-full transition-all" style={{ width: `${(enemyHp / 150) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Fever Gauge */}
        <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-sm text-amber-300 font-bold text-[11px]">
          <Sparkles size={12} />
          <span>FEVER: {crowdFever}%</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        {/* Tag Switch Button */}
        <button
          onClick={tagNextHero}
          className="flex items-center gap-1 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500 px-3 py-3 rounded-sm text-white font-black text-xs shadow-lg"
        >
          <RefreshCw size={16} />
          <span>TAG: {currentHero.title}</span>
        </button>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onPointerDown={startGuard}
            onPointerUp={stopGuard}
            className={`w-18 h-16 rounded-sm border font-black text-xs flex flex-col items-center justify-center shadow-lg transition-all ${
              isGuarding
                ? 'bg-blue-600 border-cyan-300 text-white scale-95'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
          >
            <Shield size={20} />
            <span>GUARD (0.2s)</span>
          </button>
          <button
            onClick={triggerAttack}
            className="w-20 h-16 bg-rose-600 active:bg-rose-500 border border-rose-400 rounded-sm text-white font-black text-sm flex flex-col items-center justify-center shadow-lg cursor-pointer"
          >
            <Swords size={22} />
            <span>SLASH</span>
          </button>
        </div>
      </div>

      {/* Result Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{isVictory ? (language === 'ko' ? '콜로세움 제패 승리!' : 'COLOSSEUM VICTORY!') : 'DEFEATED'}</h2>
            <div className="bg-slate-950 p-3 rounded-xs border border-amber-400/30 text-amber-300 font-bold text-sm">
              +{rewardSns} SNS 포인트 획득!
            </div>
            <button
              onClick={onExit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-sm border border-amber-300 text-sm"
            >
              {language === 'ko' ? '확인 및 돌아가기' : 'Confirm & Exit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
