import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Shield, Swords, Zap, Flame } from 'lucide-react';
import { CardData } from '../types';

interface VoxelDragonSlayerGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelDragonSlayerGame: React.FC<VoxelDragonSlayerGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [dragonHp, setDragonHp] = useState<number>(200);
  const [headHp, setHeadHp] = useState<number>(50);
  const [wingHp, setWingHp] = useState<number>(50);
  const [isGroggy, setIsGroggy] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0, 10),
    pVel: new THREE.Vector3(0, 0, 0),
    isAttacking: false,
    attackCooldown: 0,
    isRolling: false,
    rollTime: 0,
    dragonHp: 200,
    headHp: 50,
    wingHp: 50,
    groggyTimer: 0,
    dragonAttackTimer: 90,
    playerHp: 100,
    joystick: { active: false, dx: 0, dy: 0 },
    isGameOver: false,
    isVictory: false
  });

  const attackDragon = (targetPart: 'head' | 'wing' | 'body') => {
    const s = stateRef.current;
    if (s.attackCooldown > 0 || s.isGameOver) return;
    s.isAttacking = true;
    s.attackCooldown = 15;
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    let dmg = 20;
    if (targetPart === 'head') {
      s.headHp = Math.max(0, s.headHp - dmg);
      setHeadHp(s.headHp);
      if (s.headHp === 0 && !s.groggyTimer) {
        s.groggyTimer = 180; // 3 sec groggy!
        setIsGroggy(true);
      }
    } else if (targetPart === 'wing') {
      s.wingHp = Math.max(0, s.wingHp - dmg);
      setWingHp(s.wingHp);
      if (s.wingHp === 0 && !s.groggyTimer) {
        s.groggyTimer = 180;
        setIsGroggy(true);
      }
    }

    if (s.groggyTimer > 0) dmg *= 2;
    s.dragonHp = Math.max(0, s.dragonHp - dmg);
    setDragonHp(s.dragonHp);

    if (s.dragonHp <= 0) {
      s.isGameOver = true;
      s.isVictory = true;
      setIsGameOver(true);
      setIsVictory(true);
      const reward = 260;
      setRewardSns(reward);
      onReward(reward);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    }
  };

  const rollDodge = () => {
    const s = stateRef.current;
    if (s.isRolling || s.isGameOver) return;
    s.isRolling = true;
    s.rollTime = 20;
    s.pPos.x += (Math.random() > 0.5 ? 4 : -4);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x140a1c);
    scene.fog = new THREE.FogExp2(0x140a1c, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 7, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffeedd, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xff4500, 1.6);
    dirLight.position.set(10, 25, 10);
    scene.add(dirLight);

    // Volcano Rock Ground
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x24172b });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Dragon Group
    const dragonGroup = new THREE.Group();
    const dBody = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 6), new THREE.MeshLambertMaterial({ color: 0x800e13 }));
    dBody.position.y = 2.5;
    dragonGroup.add(dBody);

    const dHead = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2, 3), new THREE.MeshLambertMaterial({ color: 0xad2831 }));
    dHead.position.set(0, 3.5, 3.5);
    dragonGroup.add(dHead);

    const dWings = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 3), new THREE.MeshLambertMaterial({ color: 0x38040e }));
    dWings.position.set(0, 4, -0.5);
    dragonGroup.add(dWings);

    dragonGroup.position.set(0, 0, -4);
    scene.add(dragonGroup);

    // Hunter Player Mesh
    const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 1.2), new THREE.MeshLambertMaterial({ color: 0x00f5d4 }));
    playerMesh.position.y = 1;
    scene.add(playerMesh);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      if (s.attackCooldown > 0) s.attackCooldown -= 1;
      if (s.rollTime > 0) s.rollTime -= 1;
      else s.isRolling = false;

      // Joystick Movement
      if (s.joystick.active) {
        s.pPos.x += s.joystick.dx * 0.15;
        s.pPos.z += s.joystick.dy * 0.15;
      }
      s.pPos.x = Math.max(-15, Math.min(15, s.pPos.x));
      s.pPos.z = Math.max(3, Math.min(20, s.pPos.z));
      playerMesh.position.copy(s.pPos);

      // Groggy Handling
      if (s.groggyTimer > 0) {
        s.groggyTimer -= 1;
        dragonGroup.rotation.z = Math.sin(Date.now() * 0.01) * 0.2;
        if (s.groggyTimer <= 0) setIsGroggy(false);
      } else {
        dragonGroup.rotation.z = 0;
        // Dragon Attack
        s.dragonAttackTimer -= 1;
        if (s.dragonAttackTimer <= 0) {
          s.dragonAttackTimer = 110;
          if (!s.isRolling) {
            s.playerHp = Math.max(0, s.playerHp - 25);
            setPlayerHp(s.playerHp);
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
            if (s.playerHp <= 0) {
              s.isGameOver = true;
              setIsGameOver(true);
              const reward = 50;
              setRewardSns(reward);
              onReward(reward);
            }
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
      camera.updateProjectionMatrix();
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
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white text-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-sm border border-slate-700 font-bold"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        {/* Dragon HP & Parts */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-rose-400 font-black text-xs">DRAGON HP: {dragonHp}/200 {isGroggy && '⚡ GROGGY!'}</span>
            <div className="w-36 bg-slate-950 border border-rose-500/40 h-2.5 rounded-xs overflow-hidden">
              <div className="bg-rose-600 h-full transition-all" style={{ width: `${(dragonHp / 200) * 100}%` }} />
            </div>
          </div>
          <div className="text-[10px] text-amber-300 font-bold flex gap-1">
            <span>[머리: {headHp}]</span>
            <span>[날개: {wingHp}]</span>
          </div>
        </div>

        {/* Hunter HP */}
        <div className="flex items-center gap-1 text-cyan-400 font-bold">
          <span>HP: {playerHp}/100</span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Part Targeting & Action Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex gap-2">
          <button
            onClick={() => attackDragon('head')}
            className="px-3 py-3 bg-amber-600 active:bg-amber-500 border border-amber-400 rounded-sm text-white font-black text-xs shadow-lg"
          >
            🎯 머리 타격
          </button>
          <button
            onClick={() => attackDragon('wing')}
            className="px-3 py-3 bg-rose-700 active:bg-rose-600 border border-rose-500 rounded-sm text-white font-black text-xs shadow-lg"
          >
            🪓 날개 절단
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={rollDodge}
            className="w-18 h-14 bg-slate-900 border border-cyan-400 text-cyan-300 font-black text-xs rounded-sm shadow-lg flex flex-col items-center justify-center"
          >
            <Shield size={16} />
            ROLL
          </button>
          <button
            onClick={() => attackDragon('body')}
            className="w-20 h-14 bg-red-600 active:bg-red-500 border border-red-400 text-white font-black text-sm rounded-sm shadow-lg flex flex-col items-center justify-center"
          >
            <Swords size={20} />
            ATTACK
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{isVictory ? (language === 'ko' ? '거대 드래곤 토벌 성공!' : 'DRAGON HUNT COMPLETE!') : 'HUNT FAILED'}</h2>
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
