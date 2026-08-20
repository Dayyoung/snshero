import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Trophy, Swords, Zap, Shield, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface VoxelMightyBoxingGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelMightyBoxingGame: React.FC<VoxelMightyBoxingGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const isKo = language === 'ko';
  const mountRef = useRef<HTMLDivElement>(null);

  const [playerHp, setPlayerHp] = useState<number>(100);
  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [enemyDowns, setEnemyDowns] = useState<number>(0);
  const maxDowns = 3;
  const [combo, setCombo] = useState<number>(0);
  const [isDodging, setIsDodging] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    playerHp: 100,
    enemyHp: 100,
    enemyDowns: 0,
    playerWeave: 0, // -1 (left), 0 (center), 1 (right)
    weaveTimer: 0,
    enemyAttackTimer: 1.5,
    enemyIsAttacking: false,
    enemyAttackType: 'left_hook' as 'left_hook' | 'right_hook' | 'straight',
    combo: 0,
    isGameOver: false
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x110d1c);
    scene.fog = new THREE.Fog(0x110d1c, 10, 35);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 1.6, 2.5);
    camera.lookAt(0, 1.4, -0.5);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowSpecMode ? 1 : 2));
    renderer.shadowMap.enabled = !lowSpecMode;
    container.appendChild(renderer.domElement);

    // Arena Ring Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x332244, 0.9);
    scene.add(hemiLight);

    const spotLight = new THREE.SpotLight(0xffddaa, 2.5);
    spotLight.position.set(0, 8, 1);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 0.5;
    scene.add(spotLight);

    // Boxing Ring Canvas & Ropes
    const ringGeo = new THREE.BoxGeometry(8, 0.4, 8);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, roughness: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.2;
    scene.add(ring);

    // Ropes
    for (let h of [0.5, 0.9, 1.3]) {
      const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, 7.8, 8);
      const ropeMat = new THREE.MeshStandardMaterial({ color: 0xcc3333 });
      const ropeN = new THREE.Mesh(ropeGeo, ropeMat);
      ropeN.rotation.z = Math.PI / 2;
      ropeN.position.set(0, h, -3.9);
      scene.add(ropeN);
    }

    // Voxel Opponent (Minotaur Mighty Boxer)
    const enemyGroup = new THREE.Group();
    const eBodyGeo = new THREE.BoxGeometry(0.9, 1.1, 0.5);
    const eBodyMat = new THREE.MeshStandardMaterial({ color: 0x8b3a2b });
    const eBody = new THREE.Mesh(eBodyGeo, eBodyMat);
    eBody.position.y = 1.3;

    const eHeadGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const eHeadMat = new THREE.MeshStandardMaterial({ color: 0x5c261e });
    const eHead = new THREE.Mesh(eHeadGeo, eHeadMat);
    eHead.position.y = 2.15;

    // Horns
    const hornGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xddccaa });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.35, 2.45, 0);
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.35, 2.45, 0);

    // Enemy Gloves
    const gloveGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xd9534f });
    const eGloveL = new THREE.Mesh(gloveGeo, gloveMat);
    eGloveL.position.set(-0.55, 1.5, 0.4);
    const eGloveR = new THREE.Mesh(gloveGeo, gloveMat);
    eGloveR.position.set(0.55, 1.5, 0.4);

    enemyGroup.add(eBody, eHead, hornL, hornR, eGloveL, eGloveR);
    enemyGroup.position.set(0, 0, -1.2);
    scene.add(enemyGroup);

    // Player Gloves in First-Person
    const playerGloves = new THREE.Group();
    const pGloveMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.3 });
    const pGloveL = new THREE.Mesh(gloveGeo, pGloveMat);
    pGloveL.position.set(-0.35, 1.2, 1.4);
    const pGloveR = new THREE.Mesh(gloveGeo, pGloveMat);
    pGloveR.position.set(0.35, 1.2, 1.4);
    playerGloves.add(pGloveL, pGloveR);
    scene.add(playerGloves);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (!stateRef.current.isGameOver) {
        // Weave return to center
        if (stateRef.current.weaveTimer > 0) {
          stateRef.current.weaveTimer -= delta;
          if (stateRef.current.weaveTimer <= 0) {
            stateRef.current.playerWeave = 0;
            setIsDodging(false);
          }
        }
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, stateRef.current.playerWeave * 0.8, 0.15);
        playerGloves.position.x = THREE.MathUtils.lerp(playerGloves.position.x, stateRef.current.playerWeave * 0.6, 0.15);

        // Enemy AI attack timer
        stateRef.current.enemyAttackTimer -= delta;
        if (stateRef.current.enemyAttackTimer <= 0 && !stateRef.current.enemyIsAttacking) {
          stateRef.current.enemyIsAttacking = true;
          const types: ('left_hook' | 'right_hook' | 'straight')[] = ['left_hook', 'right_hook', 'straight'];
          stateRef.current.enemyAttackType = types[Math.floor(Math.random() * types.length)];
          stateRef.current.enemyAttackTimer = 1.2 + Math.random() * 0.8;
        }

        // Enemy Attack Motion
        if (stateRef.current.enemyIsAttacking) {
          const type = stateRef.current.enemyAttackType;
          if (type === 'left_hook') {
            eGloveL.position.x = THREE.MathUtils.lerp(eGloveL.position.x, 0.2, 0.2);
            eGloveL.position.z = THREE.MathUtils.lerp(eGloveL.position.z, 1.2, 0.2);
          } else if (type === 'right_hook') {
            eGloveR.position.x = THREE.MathUtils.lerp(eGloveR.position.x, -0.2, 0.2);
            eGloveR.position.z = THREE.MathUtils.lerp(eGloveR.position.z, 1.2, 0.2);
          } else {
            eGloveR.position.z = THREE.MathUtils.lerp(eGloveR.position.z, 1.3, 0.25);
          }

          // Check hit collision
          if (eGloveL.position.z > 0.9 || eGloveR.position.z > 0.9) {
            // Check if player dodged correctly
            let dodged = false;
            if (type === 'left_hook' && stateRef.current.playerWeave === 1) dodged = true;
            if (type === 'right_hook' && stateRef.current.playerWeave === -1) dodged = true;
            if (type === 'straight' && stateRef.current.playerWeave !== 0) dodged = true;

            if (!dodged) {
              // Player Hit!
              stateRef.current.playerHp = Math.max(0, stateRef.current.playerHp - 15);
              setPlayerHp(stateRef.current.playerHp);
              stateRef.current.combo = 0;
              setCombo(0);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

              if (stateRef.current.playerHp <= 0) {
                stateRef.current.isGameOver = true;
                setIsGameOver(true);
                setIsVictory(false);
                const r = 40 + stateRef.current.enemyDowns * 30;
                setRewardSns(r);
                onReward(r);
              }
            } else {
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            }

            // Reset enemy gloves
            stateRef.current.enemyIsAttacking = false;
            eGloveL.position.set(-0.55, 1.5, 0.4);
            eGloveR.position.set(0.55, 1.5, 0.4);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix;
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [lowSpecMode, onReward, playSfx]);

  const handleWeave = (direction: -1 | 1) => {
    if (stateRef.current.isGameOver) return;
    stateRef.current.playerWeave = direction;
    stateRef.current.weaveTimer = 0.5;
    setIsDodging(true);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handlePunch = (isUppercut: boolean = false) => {
    if (stateRef.current.isGameOver) return;

    const isCounter = isDodging || stateRef.current.weaveTimer > 0;
    const damage = isUppercut ? (isCounter ? 35 : 18) : (isCounter ? 20 : 10);

    stateRef.current.enemyHp = Math.max(0, stateRef.current.enemyHp - damage);
    setEnemyHp(stateRef.current.enemyHp);

    stateRef.current.combo += 1;
    setCombo(stateRef.current.combo);

    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    if (stateRef.current.enemyHp <= 0) {
      // Enemy Knockdown!
      stateRef.current.enemyDowns += 1;
      setEnemyDowns(stateRef.current.enemyDowns);

      if (stateRef.current.enemyDowns >= maxDowns) {
        // TKO Victory!
        stateRef.current.isGameOver = true;
        setIsGameOver(true);
        setIsVictory(true);
        const reward = 260;
        setRewardSns(reward);
        onReward(reward);
      } else {
        // Reset enemy HP for next round
        stateRef.current.enemyHp = 100;
        setEnemyHp(100);
      }
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden font-mono select-none">
      <div ref={mountRef} className="w-full h-full" />

      {/* Top HUD with HP Bars */}
      <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="pointer-events-auto p-2 bg-slate-900/80 border border-slate-700 text-slate-200 rounded-sm hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>{isKo ? '나가기' : 'Exit'}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-red-500/40 px-3 py-1.5 rounded-sm">
            <Trophy size={16} className="text-amber-400" />
            <span className="text-xs text-amber-300 font-bold">
              {isKo ? `다운 횟수: ${enemyDowns}/${maxDowns} KO` : `DOWNS: ${enemyDowns}/${maxDowns}`}
            </span>
            {combo > 1 && (
              <span className="text-[11px] text-orange-400 font-black animate-pulse">
                {combo} HIT!
              </span>
            )}
          </div>
        </div>

        {/* Dual HP Bars */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2 border border-slate-800 rounded-sm">
          <div>
            <div className="flex justify-between text-[10px] text-blue-300 font-bold mb-1">
              <span>{isKo ? '나 (HERO)' : 'PLAYER'}</span>
              <span>{playerHp}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-blue-900">
              <div className="h-full bg-blue-500 transition-all duration-150" style={{ width: `${playerHp}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-red-300 font-bold mb-1">
              <span>{isKo ? '미노타우로스' : 'MINOTAUR'}</span>
              <span>{enemyHp}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-red-900">
              <div className="h-full bg-red-500 transition-all duration-150" style={{ width: `${enemyHp}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Controls: Weave Left / Uppercut / Weave Right / Straight Punch */}
      <div className="absolute bottom-6 left-3 right-3 flex flex-col gap-2 z-10">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handlePunch(false)}
            className="py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs uppercase rounded-sm border border-blue-400 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Swords size={16} />
            <span>{isKo ? '🥊 스트레이트 펀치' : '🥊 STRAIGHT'}</span>
          </button>
          <button
            onClick={() => handlePunch(true)}
            className="py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase rounded-sm border border-amber-300 shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap size={16} />
            <span>{isKo ? '⚡ 카운터 어퍼컷 (2X)' : '⚡ COUNTER UPPER'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleWeave(-1)}
            className="py-3 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-sm border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Shield size={14} />
            <span>{isKo ? '◀ 좌측 위빙 회피' : '◀ WEAVE LEFT'}</span>
          </button>
          <button
            onClick={() => handleWeave(1)}
            className="py-3 bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-slate-200 font-bold text-xs uppercase rounded-sm border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Shield size={14} />
            <span>{isKo ? '우측 위빙 회피 ▶' : 'WEAVE RIGHT ▶'}</span>
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-slate-900 border border-amber-500/50 p-5 rounded-none text-center space-y-4 shadow-2xl">
            <div className="flex justify-center">
              <Sparkles size={36} className="text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-lg font-black text-amber-400 uppercase tracking-widest">
              {isVictory ? (isKo ? '🏆 3회 다운 KO 승리!' : '🏆 KNOCKOUT CHAMPION!') : (isKo ? '❌ 경기 패배' : '❌ DEFEAT')}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 border border-slate-800">
              <div className="flex justify-between">
                <span>{isKo ? '다운 횟수' : 'Knockdowns'}</span>
                <span className="font-bold text-amber-300">{enemyDowns} KO</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-amber-400 font-bold">
                <span>{isKo ? '획득 SNS 보상' : 'Earned SNS'}</span>
                <span>+{rewardSns} SNS</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-sm transition-all"
              >
                {isKo ? '보상 수령 및 복귀' : 'Claim & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
