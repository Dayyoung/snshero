import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Target } from 'lucide-react';
import { CardData } from '../types';

interface VoxelArcherHeroGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelArcherHeroGame: React.FC<VoxelArcherHeroGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wave, setWave] = useState<number>(1);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [kills, setKills] = useState<number>(0);
  const [multiShot, setMultiShot] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0.5, 12),
    pVel: new THREE.Vector3(0, 0, 0),
    isMoving: false,
    arrows: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[],
    enemies: [] as { mesh: THREE.Mesh; hp: number; maxHp: number }[],
    shootCooldown: 0,
    wave: 1,
    kills: 0,
    multiShot: 1,
    playerHp: 100,
    isGameOver: false
  });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1f12);
    scene.fog = new THREE.FogExp2(0x0d1f12, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 16, 22);
    camera.lookAt(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xa3e635, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Forest Grid
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 50), new THREE.MeshLambertMaterial({ color: 0x1e3a1e }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Archer
    const playerGroup = new THREE.Group();
    const pMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), new THREE.MeshLambertMaterial({ color: 0x84cc16 }));
    pMesh.position.y = 0.9;
    playerGroup.add(pMesh);
    const bowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.4), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    bowMesh.position.set(0, 1.0, 0.8);
    playerGroup.add(bowMesh);
    playerGroup.position.copy(stateRef.current.pPos);
    scene.add(playerGroup);

    // Spawn Enemy Wave
    const spawnWave = (w: number) => {
      const count = 4 + w * 2;
      for (let i = 0; i < count; i++) {
        const eGroup = new THREE.Group();
        const em = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
        em.position.y = 0.7;
        eGroup.add(em);
        eGroup.position.set((Math.random() - 0.5) * 28, 0, -15 - Math.random() * 15);
        scene.add(eGroup);
        stateRef.current.enemies.push({ mesh: eGroup as any, hp: 25 + w * 5, maxHp: 25 + w * 5 });
      }
    };

    spawnWave(1);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Auto-Shooting when standing still
      if (!s.isMoving) {
        s.shootCooldown -= 1;
        if (s.shootCooldown <= 0 && s.enemies.length > 0) {
          s.shootCooldown = 22; // rapid shoot
          // Find closest enemy
          let closest = s.enemies[0];
          let minDist = 999;
          s.enemies.forEach(e => {
            const dist = s.pPos.distanceTo(e.mesh.position);
            if (dist < minDist) { minDist = dist; closest = e; }
          });

          if (closest) {
            const dir = new THREE.Vector3().subVectors(closest.mesh.position, s.pPos).normalize();
            for (let i = 0; i < s.multiShot; i++) {
              const arrowMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.2), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
              const offset = new THREE.Vector3((i - (s.multiShot - 1) / 2) * 0.4, 0.9, 0);
              arrowMesh.position.copy(s.pPos).add(offset);
              scene.add(arrowMesh);
              s.arrows.push({ mesh: arrowMesh, vel: dir.clone().multiplyScalar(0.7), life: 60 });
            }
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
          }
        }
      }

      // Update Arrows
      for (let i = s.arrows.length - 1; i >= 0; i--) {
        const arr = s.arrows[i];
        arr.mesh.position.add(arr.vel);
        arr.life -= 1;

        // Check hit
        let hit = false;
        for (let j = s.enemies.length - 1; j >= 0; j--) {
          const em = s.enemies[j];
          if (arr.mesh.position.distanceTo(em.mesh.position) < 1.4) {
            em.hp -= 20;
            hit = true;
            if (em.hp <= 0) {
              scene.remove(em.mesh);
              s.enemies.splice(j, 1);
              s.kills += 1;
              setKills(s.kills);
            }
            break;
          }
        }

        if (hit || arr.life <= 0) {
          scene.remove(arr.mesh);
          s.arrows.splice(i, 1);
        }
      }

      // Update Enemies
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const em = s.enemies[i];
        const dir = new THREE.Vector3().subVectors(s.pPos, em.mesh.position).normalize();
        em.mesh.position.add(dir.multiplyScalar(0.045));

        if (em.mesh.position.distanceTo(s.pPos) < 1.5) {
          s.playerHp = Math.max(0, s.playerHp - 15);
          setPlayerHp(s.playerHp);
          scene.remove(em.mesh);
          s.enemies.splice(i, 1);
          if (s.playerHp <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
            const reward = 60 + s.kills * 5;
            setRewardSns(reward);
            onReward(reward);
          }
        }
      }

      // Check Next Wave
      if (s.enemies.length === 0) {
        s.wave += 1;
        setWave(s.wave);
        if (s.wave % 2 === 0) {
          s.multiShot = Math.min(4, s.multiShot + 1);
          setMultiShot(s.multiShot);
        }
        if (s.wave > 4) {
          s.isGameOver = true;
          setIsGameOver(true);
          const reward = 230;
          setRewardSns(reward);
          onReward(reward);
          playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        } else {
          spawnWave(s.wave);
        }
      }

      playerGroup.position.copy(s.pPos);
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
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white text-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-sm border border-slate-700 font-bold"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-lime-400 font-black">WAVE {wave}/4</span>
          <span className="text-amber-300 font-bold">🎯 MULTISHOT x{multiShot}</span>
        </div>

        <div className="text-cyan-400 font-bold">HP: {playerHp}/100</div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Bottom Joystick Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-auto">
        <button
          onPointerDown={() => { stateRef.current.isMoving = true; stateRef.current.pPos.x -= 1.5; }}
          onPointerUp={() => { stateRef.current.isMoving = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-lime-600 border border-lime-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ◀
        </button>
        <button
          onPointerDown={() => { stateRef.current.isMoving = true; stateRef.current.pPos.z -= 1.5; }}
          onPointerUp={() => { stateRef.current.isMoving = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-lime-600 border border-lime-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▲
        </button>
        <button
          onPointerDown={() => { stateRef.current.isMoving = true; stateRef.current.pPos.z += 1.5; }}
          onPointerUp={() => { stateRef.current.isMoving = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-lime-600 border border-lime-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▼
        </button>
        <button
          onPointerDown={() => { stateRef.current.isMoving = true; stateRef.current.pPos.x += 1.5; }}
          onPointerUp={() => { stateRef.current.isMoving = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-lime-600 border border-lime-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▶
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{wave >= 4 ? (language === 'ko' ? '숲 수호 성공!' : 'DEFENSE VICTORY!') : 'DEFENSE FAILED'}</h2>
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
