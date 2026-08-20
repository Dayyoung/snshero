import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Zap, Sparkles, Flame, Skull } from 'lucide-react';
import { CardData } from '../types';

interface VoxelVampireSurvivalGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelVampireSurvivalGame: React.FC<VoxelVampireSurvivalGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [survivalTime, setSurvivalTime] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [exp, setExp] = useState<number>(0);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [kills, setKills] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0.5, 0),
    pVel: new THREE.Vector3(0, 0, 0),
    keys: {} as Record<string, boolean>,
    enemies: [] as { mesh: THREE.Mesh; hp: number; maxHp: number }[],
    orbs: [] as { mesh: THREE.Mesh; pos: THREE.Vector3 }[],
    scytheAngle: 0,
    scytheMesh: null as THREE.Mesh | null,
    level: 1,
    exp: 0,
    kills: 0,
    time: 0,
    playerHp: 100,
    isGameOver: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0612);
    scene.fog = new THREE.FogExp2(0x0a0612, 0.025);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 22, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xa855f7, 1.8);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ color: 0x181024 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player Hero
    const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), new THREE.MeshLambertMaterial({ color: 0xc084fc }));
    playerMesh.position.y = 0.9;
    scene.add(playerMesh);

    // Orbiting Scythe Weapon
    const scytheMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 2.0), new THREE.MeshLambertMaterial({ color: 0xf43f5e }));
    scene.add(scytheMesh);
    stateRef.current.scytheMesh = scytheMesh;

    // Timer Interval
    const timerInterval = setInterval(() => {
      const s = stateRef.current;
      if (s.isGameOver) return;
      s.time += 1;
      setSurvivalTime(s.time);

      // Spawn Swarm
      if (s.enemies.length < 35) {
        const count = 3 + Math.floor(s.time / 10);
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 22 + Math.random() * 8;
          const eMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshLambertMaterial({ color: 0x475569 }));
          eMesh.position.set(s.pPos.x + Math.cos(angle) * dist, 0.6, s.pPos.z + Math.sin(angle) * dist);
          scene.add(eMesh);
          s.enemies.push({ mesh: eMesh, hp: 20 + Math.floor(s.time / 5) * 5, maxHp: 20 });
        }
      }

      if (s.time >= 60) { // 60s win condition
        s.isGameOver = true;
        setIsGameOver(true);
        const reward = 300;
        setRewardSns(reward);
        onReward(reward);
        playSfx?.('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      }
    }, 1000);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Movement
      const isUp = s.keys['w'] || s.keys['arrowup'];
      const isDown = s.keys['s'] || s.keys['arrowdown'];
      const isLeft = s.keys['a'] || s.keys['arrowleft'];
      const isRight = s.keys['d'] || s.keys['arrowright'];

      const moveSpeed = 0.18;
      if (isUp) s.pPos.z -= moveSpeed;
      if (isDown) s.pPos.z += moveSpeed;
      if (isLeft) s.pPos.x -= moveSpeed;
      if (isRight) s.pPos.x += moveSpeed;

      s.pPos.x = Math.max(-35, Math.min(35, s.pPos.x));
      s.pPos.z = Math.max(-35, Math.min(35, s.pPos.z));
      playerMesh.position.copy(s.pPos);

      // Scythe Auto Orbit
      s.scytheAngle += 0.08;
      const radius = 3.5;
      const scythePos = new THREE.Vector3(
        s.pPos.x + Math.cos(s.scytheAngle) * radius,
        1.0,
        s.pPos.z + Math.sin(s.scytheAngle) * radius
      );
      scytheMesh.position.copy(scythePos);
      scytheMesh.rotation.y = -s.scytheAngle;

      // Check Scythe collision with enemies
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const em = s.enemies[i];
        if (scytheMesh.position.distanceTo(em.mesh.position) < 2.0) {
          em.hp -= 25;
          if (em.hp <= 0) {
            scene.remove(em.mesh);
            s.enemies.splice(i, 1);
            s.kills += 1;
            s.exp += 15;
            setKills(s.kills);
            if (s.exp >= s.level * 50) {
              s.exp = 0;
              s.level += 1;
              setLevel(s.level);
              playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            }
            setExp(s.exp);
          }
        }
      }

      // Enemy AI swarm follow
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const em = s.enemies[i];
        const dir = new THREE.Vector3().subVectors(s.pPos, em.mesh.position).normalize();
        em.mesh.position.add(dir.multiplyScalar(0.045));

        if (em.mesh.position.distanceTo(s.pPos) < 1.4) {
          s.playerHp = Math.max(0, s.playerHp - 0.5);
          setPlayerHp(Math.round(s.playerHp));
          if (s.playerHp <= 0) {
            s.isGameOver = true;
            setIsGameOver(true);
            const reward = 80 + s.kills * 3;
            setRewardSns(reward);
            onReward(reward);
          }
        }
      }

      camera.position.set(s.pPos.x, 22, s.pPos.z + 16);
      camera.lookAt(s.pPos);

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
      clearInterval(timerInterval);
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

        <div className="flex items-center gap-4">
          <span className="text-purple-400 font-black">LV.{level}</span>
          <span className="text-amber-300 font-bold">⏳ {survivalTime}s / 60s</span>
          <span className="text-rose-400 font-bold">💀 KILLS: {kills}</span>
        </div>

        <div className="text-cyan-400 font-bold">HP: {playerHp}/100</div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Bottom D-pad */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 pointer-events-auto">
        <button
          onPointerDown={() => { stateRef.current.keys['a'] = true; }}
          onPointerUp={() => { stateRef.current.keys['a'] = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-purple-600 border border-purple-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ◀
        </button>
        <button
          onPointerDown={() => { stateRef.current.keys['w'] = true; }}
          onPointerUp={() => { stateRef.current.keys['w'] = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-purple-600 border border-purple-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▲
        </button>
        <button
          onPointerDown={() => { stateRef.current.keys['s'] = true; }}
          onPointerUp={() => { stateRef.current.keys['s'] = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-purple-600 border border-purple-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▼
        </button>
        <button
          onPointerDown={() => { stateRef.current.keys['d'] = true; }}
          onPointerUp={() => { stateRef.current.keys['d'] = false; }}
          className="w-16 h-16 bg-slate-900/90 active:bg-purple-600 border border-purple-400 rounded-sm text-white font-black text-xl flex items-center justify-center shadow-lg"
        >
          ▶
        </button>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{survivalTime >= 60 ? (language === 'ko' ? '밤의 생존 성공!' : 'NIGHT SURVIVED!') : 'FALLEN'}</h2>
            <p className="text-sm text-slate-300">
              {language === 'ko' ? `생존 시간: ${survivalTime}초 | 처치: ${kills}마리` : `Survival Time: ${survivalTime}s | Kills: ${kills}`}
            </p>
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
