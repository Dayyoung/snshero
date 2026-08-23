import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Trophy, ArrowLeft, Crosshair } from 'lucide-react';
import { CardData } from '../types';

interface VoxelTankBounceGameProps {
  deck: CardData[];
  language: string;
  lowSpecMode?: boolean;
  playSfx?: (url: string) => void;
  onExit: () => void;
  onReward: (amount: number) => void;
}

export const VoxelTankBounceGame: React.FC<VoxelTankBounceGameProps> = ({
  deck: _deck,
  language,
  lowSpecMode = false,
  playSfx,
  onExit,
  onReward
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [tanksLeft, setTanksLeft] = useState<number>(5);
  const [ammo, setAmmo] = useState<number>(10);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [rewardSns, setRewardSns] = useState<number>(0);

  const stateRef = useRef({
    pPos: new THREE.Vector3(0, 0.6, 12),
    pRot: 0,
    bullets: [] as { mesh: THREE.Mesh; vel: THREE.Vector3; bounces: number }[],
    enemyTanks: [] as { mesh: THREE.Mesh; hp: number }[],
    keys: {} as Record<string, boolean>,
    ammo: 10,
    tanksLeft: 5,
    playerHp: 100,
    isGameOver: false
  });

  const fireShell = () => {
    const s = stateRef.current;
    if (s.ammo <= 0 || s.isGameOver) return;
    s.ammo -= 1;
    setAmmo(s.ammo);
    playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    const fwd = new THREE.Vector3(-Math.sin(s.pRot), 0, -Math.cos(s.pRot)).normalize();
    const shellMesh = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    shellMesh.position.copy(s.pPos).add(new THREE.Vector3(0, 0.4, 0));
    s.bullets.push({ mesh: shellMesh, vel: fwd.multiplyScalar(0.65), bounces: 2 });
  };

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
    scene.background = new THREE.Color(0x111827);
    scene.fog = new THREE.FogExp2(0x111827, 0.02);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 24, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !lowSpecMode });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight.position.set(10, 30, 10);
    scene.add(dirLight);

    // Arena Floor & Obstacle Walls
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(36, 48), new THREE.MeshLambertMaterial({ color: 0x1f2937 }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Wall Obstacles
    const wallGeo = new THREE.BoxGeometry(6, 2, 2);
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const w1 = new THREE.Mesh(wallGeo, wallMat);
    w1.position.set(-6, 1, 0);
    scene.add(w1);
    const w2 = new THREE.Mesh(wallGeo, wallMat);
    w2.position.set(6, 1, 0);
    scene.add(w2);

    // Player Tank
    const playerTank = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 2.4), new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }));
    body.position.y = 0.4;
    playerTank.add(body);
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.6), new THREE.MeshLambertMaterial({ color: 0x0284c7 }));
    turret.rotation.x = Math.PI / 2;
    turret.position.set(0, 0.6, -0.8);
    playerTank.add(turret);
    scene.add(playerTank);

    // Spawn 5 Enemy Tanks
    for (let i = 0; i < 5; i++) {
      const eGroup = new THREE.Group();
      const eb = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 2.4), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
      eb.position.y = 0.4;
      eGroup.add(eb);
      eGroup.position.set((Math.random() - 0.5) * 26, 0, -6 - Math.random() * 14);
      scene.add(eGroup);
      stateRef.current.enemyTanks.push({ mesh: eGroup as any, hp: 20 });
    }

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const s = stateRef.current;
      if (s.isGameOver) {
        renderer.render(scene, camera);
        return;
      }

      // Movement
      const isLeft = s.keys['a'] || s.keys['arrowleft'];
      const isRight = s.keys['d'] || s.keys['arrowright'];
      const isUp = s.keys['w'] || s.keys['arrowup'];
      const isDown = s.keys['s'] || s.keys['arrowdown'];

      if (isLeft) s.pRot += 0.05;
      if (isRight) s.pRot -= 0.05;

      const fwd = new THREE.Vector3(-Math.sin(s.pRot), 0, -Math.cos(s.pRot));
      if (isUp) s.pPos.addScaledVector(fwd, 0.15);
      if (isDown) s.pPos.addScaledVector(fwd, -0.1);

      s.pPos.x = Math.max(-16, Math.min(16, s.pPos.x));
      s.pPos.z = Math.max(-22, Math.min(22, s.pPos.z));

      playerTank.position.copy(s.pPos);
      playerTank.rotation.y = s.pRot;

      // Update Bullets & Ricochet Bounces
      for (let i = s.bullets.length - 1; i >= 0; i--) {
        const b = s.bullets[i];
        if (!scene.children.includes(b.mesh)) scene.add(b.mesh);
        b.mesh.position.add(b.vel);

        // Wall Ricochet Bounce
        if (Math.abs(b.mesh.position.x) > 17) {
          b.vel.x *= -1;
          b.bounces -= 1;
        }
        if (Math.abs(b.mesh.position.z) > 23) {
          b.vel.z *= -1;
          b.bounces -= 1;
        }

        // Enemy Hit
        for (let j = s.enemyTanks.length - 1; j >= 0; j--) {
          const et = s.enemyTanks[j];
          if (b.mesh.position.distanceTo(et.mesh.position) < 2.0) {
            scene.remove(et.mesh);
            s.enemyTanks.splice(j, 1);
            s.tanksLeft -= 1;
            setTanksLeft(s.tanksLeft);
            b.bounces = -1;
            playSfx?.('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
            if (s.tanksLeft === 0) {
              s.isGameOver = true;
              setIsGameOver(true);
              setIsVictory(true);
              const reward = 250;
              setRewardSns(reward);
              onReward(reward);
            }
            break;
          }
        }

        if (b.bounces < 0) {
          scene.remove(b.mesh);
          s.bullets.splice(i, 1);
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
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 bg-slate-900/85 backdrop-blur-xs border-b border-slate-800 flex items-center justify-between text-white text-xs">
        <button
          onClick={onExit}
          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-sm border border-slate-700 font-bold"
        >
          <ArrowLeft size={14} />
          <span>{language === 'ko' ? '나가기' : 'Exit'}</span>
        </button>

        <div className="flex items-center gap-4">
          <span className="text-rose-400 font-black">ENEMY TANKS: {tanksLeft}/5</span>
          <span className="text-amber-300 font-bold">💣 AMMO: {ammo}</span>
        </div>

        <div className="text-cyan-400 font-bold">HP: {playerHp}/100</div>
      </div>

      {/* 3D Canvas */}
      <div ref={mountRef} className="flex-1 w-full h-full" />

      {/* Screen Gesture Touch Overlay */}
      {!isGameOver && (
        <div
          className="absolute inset-0 z-10 select-none touch-none cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = e.clientX - rect.left;
            const startY = e.clientY - rect.top;
            let moved = false;

            const onMove = (moveEvt: PointerEvent) => {
              const curX = moveEvt.clientX - rect.left;
              const curY = moveEvt.clientY - rect.top;
              const dx = curX - startX;
              const dy = curY - startY;

              if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                moved = true;
                stateRef.current.keys['w'] = dy < -8;
                stateRef.current.keys['a'] = dx < -10;
                stateRef.current.keys['d'] = dx > 10;
              }
            };

            const onUp = () => {
              window.removeEventListener('pointermove', onMove);
              window.removeEventListener('pointerup', onUp);
              window.removeEventListener('pointercancel', onUp);
              stateRef.current.keys['w'] = false;
              stateRef.current.keys['a'] = false;
              stateRef.current.keys['d'] = false;

              if (!moved) {
                // Tap: Fire Shell
                fireShell();
              }
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
          }}
        />
      )}

      {/* Minimal Bottom Guide */}
      <div className="absolute bottom-3 left-0 right-0 z-20 px-4 flex items-center justify-center pointer-events-none select-none">
        <div className="px-3 py-1 bg-black/70 border border-amber-400/30 rounded-full text-[10px] text-amber-300 font-mono backdrop-blur-xs">
          {language === 'ko' ? '드래그: 탱크 주행 & 조향 | 탭: 도탄 포탄 발사 (버튼 없음)' : 'Drag: Drive & Steer | Tap: Fire Ricochet Shell (No Buttons)'}
        </div>
      </div>

      {/* Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-sm max-w-sm w-full text-center text-white flex flex-col gap-4">
            <Trophy size={48} className="mx-auto text-amber-400" />
            <h2 className="text-xl font-black">{isVictory ? (language === 'ko' ? '도탄 탱크 제패!' : 'TANK VICTORY!') : 'OUT OF AMMO'}</h2>
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
